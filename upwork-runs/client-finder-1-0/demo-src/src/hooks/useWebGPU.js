import { useState, useCallback, useRef } from 'react';

const AUDIT_PROMPT = `You are a web design auditor for a software agency. Analyze this website screenshot and rate it:
1. UI Modernity (visual design, typography, whitespace): 1-10
2. Mobile Responsiveness (flexible layout, touch targets): 1-10
3. Overall Functionality (navigation clarity, content structure): 1-10
Respond ONLY with valid JSON (no markdown, no explanation):
{"modernity":N,"mobile":N,"function":N,"notes":"2-3 sentences of specific observations","outdated_signs":["specific issues found"]}`;

// transformers.js does not expose an image-text-to-text pipeline — use the
// AutoProcessor + AutoModelForVision2Seq API directly for SmolVLM.
export function useWebGPU() {
  const [gpuInfo, setGpuInfo] = useState(null);
  const [backend, setBackend] = useState(null); // 'webgpu' | 'wasm'
  const [modelReady, setModelReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState(null);

  // { processor, model } — loaded once, reused for all audits
  const modelRef = useRef(null);

  const detectGPU = useCallback(async () => {
    if (!navigator.gpu) {
      setGpuInfo({ available: false, reason: 'navigator.gpu not found — browser does not support WebGPU' });
      setBackend('wasm');
      return;
    }
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        setGpuInfo({ available: false, reason: 'No GPU adapter found' });
        setBackend('wasm');
        return;
      }
      let info = {};
      try { info = await adapter.requestAdapterInfo(); } catch {}
      const limits = adapter.limits;
      setGpuInfo({
        available: true,
        vendor: info.vendor || 'Unknown',
        architecture: info.architecture || 'Unknown',
        device: info.device || 'Unknown',
        maxBufferSize: limits?.maxBufferSize ? (limits.maxBufferSize / 1e9).toFixed(2) + ' GB' : 'Unknown',
        maxBindGroups: limits?.maxBindGroups ?? 'Unknown',
      });
      setBackend('webgpu');
    } catch (e) {
      setGpuInfo({ available: false, reason: e.message });
      setBackend('wasm');
    }
  }, []);

  // Load processor + model once
  const initModel = useCallback(async () => {
    if (modelRef.current) { setModelReady(true); return; }
    setLoading(true);
    setProgress(0);
    setProgressMsg('Initializing SmolVLM…');
    setError(null);
    try {
      const { AutoProcessor, AutoModelForVision2Seq } = await import('@huggingface/transformers');
      const dev = backend === 'webgpu' ? 'webgpu' : 'wasm';
      const MODEL_ID = 'HuggingFaceTB/SmolVLM-256M-Instruct';

      const progressCb = (p) => {
        if (p.status === 'downloading') {
          const pct = p.total ? Math.round((p.loaded / p.total) * 55) : 0;
          setProgress(5 + pct);
          setProgressMsg(`Downloading… ${p.total ? Math.round((p.loaded / p.total) * 100) : '?'}%`);
        } else if (p.status === 'loading') {
          setProgress(65);
          setProgressMsg('Loading weights…');
        } else if (p.status === 'ready') {
          setProgress(90);
          setProgressMsg('Model ready');
        }
      };

      setProgressMsg(`Loading processor…`);
      setProgress(3);
      const processor = await AutoProcessor.from_pretrained(MODEL_ID, { progress_callback: progressCb });

      setProgressMsg(`Loading SmolVLM-256M on ${dev.toUpperCase()}…`);
      setProgress(5);
      const model = await AutoModelForVision2Seq.from_pretrained(MODEL_ID, {
        device: dev,
        dtype: dev === 'webgpu'
          ? { embed_tokens: 'fp16', vision_encoder: 'fp16', decoder_model_merged: 'q4' }
          : 'q4',
        progress_callback: progressCb,
      });

      modelRef.current = { processor, model };
      setModelReady(true);
      setProgress(100);
      setProgressMsg('SmolVLM ready');
    } catch (e) {
      setError(e.message || 'Model load failed');
    } finally {
      setLoading(false);
    }
  }, [backend]);

  // Audit one image URL — called per screenshot during Discovery
  const runAuditOnUrl = useCallback(async (imageUrl) => {
    if (!modelRef.current) await initModel();
    if (!modelRef.current) throw new Error('Model not loaded');

    const { AutoProcessor, RawImage } = await import('@huggingface/transformers');
    const { processor, model } = modelRef.current;

    const messages = [{
      role: 'user',
      content: [
        { type: 'image' },
        { type: 'text', text: AUDIT_PROMPT },
      ],
    }];

    // Apply chat template to get the text prompt
    const textPrompt = processor.apply_chat_template(messages, { add_generation_prompt: true });

    // Load the image
    const image = await RawImage.fromURL(imageUrl);

    // Build inputs
    const inputs = await processor(textPrompt, [image], { return_tensors: 'pt' });

    // Generate
    const outputIds = await model.generate({
      ...inputs,
      max_new_tokens: 200,
      do_sample: false,
    });

    // Decode only the newly generated tokens (skip the prompt)
    const promptLen = inputs.input_ids.dims[1];
    const newIds = outputIds.slice(null, [promptLen, null]);
    const decoded = processor.batch_decode(newIds, { skip_special_tokens: true });
    const text = (decoded[0] || '').trim();

    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        return {
          modernity: Number(parsed.modernity) || 5,
          mobile:    Number(parsed.mobile) || 5,
          function:  Number(parsed.function) || 5,
          notes: parsed.notes || 'Analysis complete.',
          outdated_signs: Array.isArray(parsed.outdated_signs) ? parsed.outdated_signs : [],
          backend: backend || 'wasm',
        };
      } catch {}
    }
    return {
      modernity: 5, mobile: 5, function: 5,
      notes: text.slice(0, 200) || 'Analysis complete.',
      outdated_signs: [], backend: backend || 'wasm',
    };
  }, [backend, initModel]);

  return {
    gpuInfo, backend, modelReady, loading, progress, progressMsg, error,
    detectGPU, initModel, runAuditOnUrl,
  };
}
