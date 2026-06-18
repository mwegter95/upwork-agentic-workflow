# Cover Letter: Worship Platform Audit Engagement

Your worship platform is already functional. The hard architecture work is done. What you need is an engineer who understands the domain well enough to audit it intelligently, find the real root causes, and fix them without breaking what works. That is exactly what I do.

I built a live demo before applying: https://michaelwegter.com/demos/audio-software-engineer-needed-for/

It is a complete worship playback engine built from scratch on the Web Audio API. It covers every one of the nine problem areas you listed: transport reliability, section navigation, audio synchronization, click track scheduling, guide cue triggering, stem routing, mixer channel behavior, count-in, and engine stability. You can click through the full feature set yourself right now.

**How I would approach the initial engagement:** read the codebase completely before suggesting any changes, reproduce each of your nine issues in a test environment, trace each one to its root cause, and deliver a clear diagnostic report before writing a line of new code. Then targeted, surgical fixes for the highest-priority bugs, with each change tested in isolation.

---

**Your application questions:**

**1. Have you worked on audio software, music applications, playback systems, DAWs, audio plugins, or live performance software?**

Yes. I have a Bachelor of Music from St. Olaf College and have been working in DAWs since the fifth grade, more than fifteen years of hands-on experience in Ableton Live, Logic Pro, and Pro Tools. I run a wedding DJ business and built my own production-ready software to support it: a Python program that bridges MIDI output from my out-of-date DJ controller to my current setup, handling real-time signal processing and mapping during live performances. It has run at every gig I have played without a single failure. That project is what "production-ready audio software" actually means to me: it works every single time, under pressure, with real consequences if it does not. I am also a full-stack software engineer with two and a half years at U.S. Bank and a current contract at Optum.

**2. What technologies and frameworks were used?**

For personal audio projects: Python with rtmidi and custom real-time signal processing for the MIDI bridge. Web Audio API (AudioContext, OfflineAudioContext, GainNode, StereoPannerNode, AudioWorklet) for the worship engine demo, with a Wilson-pattern lookahead scheduler for sample-accurate click track and cue timing. For professional engineering work: React, Python, .NET/C#, Angular, SQL, PostgreSQL, Docker, Kubernetes.

**3. What was your role?**

Sole developer and technical architect on both personal audio projects. I designed the systems, wrote every component, and maintain them for production use under live performance conditions. At U.S. Bank I became the sole developer and SME for a 60,000-line internal platform within the first two months of the project.

**4. Examples and links:**

- Live demo of the worship playback engine: https://michaelwegter.com/demos/audio-software-engineer-needed-for/
- Full portfolio: https://michaelwegter.com/work-samples

I would be glad to talk through the codebase and the specific issues you are running into.

Michael Wegter
michaelwegter.com
