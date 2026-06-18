# AI Chatbot for Customer Support

Hi,

Your team is spending real hours every day on "where is my order" and "how do I return this," questions a well-built bot can handle in seconds, around the clock. I built one for you.

Live demo: https://michaelwegter.com/demos/ai-chatbot-for-customer-support/

The demo runs a full customer support chatbot with a knowledge base of 20 real FAQ entries, a mock order lookup (try "where is order ORD-1001"), and a human escalation flow that respects your 9am-6pm ET window. When it can't answer, it routes to your support queue and shows a ticket confirmation. There is also an admin panel (password: admin123) where you can edit FAQ entries and see live analytics. The AI runs entirely in the browser using Transformers.js and a small WASM model, so no API tokens, no data leaving the browser, no recurring cost.

On how I would build the real thing: I would use the same in-browser RAG architecture for the public-facing chatbot if you want lowest cost (Transformers.js for embeddings, your existing help docs chunked into a JSON knowledge base the bot retrieves from client-side). Or a simple Claude API hookup if you want the best response quality and speed. For Zendesk, I would use their Web Widget SDK to open a pre-filled ticket or live chat session when the bot escalates, passing conversation context so your agents are not starting from scratch. Order status would call your real API with a lightweight client-side wrapper. The whole thing is embeddable as a single script tag on any page.

A bit about me: I am a full-stack developer currently based in the United States. I spent 2.5 years as the primary developer on a React and Python platform at U.S. Bank, serving 600 users a month and handling incident response on my own when things broke. I am now on a large Angular and .NET project at Optum and do AI-assisted delivery daily. I built the chatbot demo for this proposal in a single session using the same tools I would use on your project.

More portfolio work is at michaelwegter.com, including live tools built on React, Python, and Flask.

On timeline and pricing: I would estimate 7 to 8 business days for a production build with real Zendesk integration, real order API hookup, and a polished embed. Fixed price is the right call here, the scope is clear. I would quote $2,500 to $3,000 depending on whether Zendesk integration goes through the live API or a simulated handoff, and whether you want me to also write the Zendesk app setup guide for your team.

Happy to walk through the demo together on a call. If something in the demo is not quite what you had in mind, I can usually adjust quickly.

Thanks,
Michael Wegter
