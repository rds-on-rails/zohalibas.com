This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

1. Model & Extraction Method

How it works: When a staff member uploads a photo, the image is stored in Firebase Storage. The server-side action then:
Fetches the image from the URL.
Converts it into a Base64 encoded string.
Sends it along with a structured system prompt to the Gemini 2.0 Flash model.
The model uses its multimodal capabilities to "see" the handwritten text and return a structured JSON response.


2. Cost Analysis
Gemini 2.0 Flash is specifically designed for high-performance, low-latency, and low-cost applications. As of now, the pricing for Gemini 2.0 Flash (Pay-as-you-go) is approximately:

Input: $0.10 per 1 million tokens.
Output: $0.40 per 1 million tokens.
Images: Each image roughly translates to ~258 tokens (standard resolution).


3. Efficiency Features
To prevent unnecessary costs, the current solution includes:

Duplicate Detection: We generate a SHA-256 fingerprint for every image. If a staff member uploads the same photo twice, the system detects the match in Firestore and skips the AI extraction entirely, saving you the API call cost.
Validation: The AI is programmed to return INVALID immediately if it doesn't see a sales sheet, minimizing output token usage.