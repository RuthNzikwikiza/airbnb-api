import { Request, Response } from "express";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser, StringOutputParser } from "@langchain/core/output_parsers";
import { ChatGroq } from "@langchain/groq";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import prisma from "../config/prisma.js";
import { getCache, setCache, clearCache } from "../config/cache.js";

const model = new ChatGroq({
  model: "llama3-8b-8192",
  temperature: 0.7,
  apiKey: process.env["GROQ_API_KEY"],
});

const strictModel = new ChatGroq({
  model: "llama3-8b-8192",
  temperature: 0,
  apiKey: process.env["GROQ_API_KEY"],
});
function handleAIError(error: any, res: Response) {
  if (error?.status === 429) {
    res.status(429).json({ error: "AI service is busy, please try again in a moment." });
    return;
  }
  if (error?.status === 401) {
    res.status(500).json({ error: "AI service configuration error." });
    return;
  }
  res.status(500).json({ error: "AI service configuration error." });
}

const searchPrompt = ChatPromptTemplate.fromTemplate(`
You are a search assistant for an Airbnb-like platform.
Extract search filters from the user's natural language query.

User query: {query}

Return a JSON object with these optional fields:
- location: string (city or area mentioned)
- type: one of apartment, house, villa, cabin (if mentioned, lowercase)
- guests: number (max guests needed)
- maxPrice: number (maximum price per night in USD)

Return ONLY valid JSON. No explanation. No markdown. Example:
{{"location": "Kigali", "type": "apartment", "guests": 2, "maxPrice": 100}}

If a field is not mentioned, omit it entirely from the JSON.
`);

const searchChain = searchPrompt.pipe(strictModel).pipe(new JsonOutputParser());

export async function naturalLanguageSearch(req: Request, res: Response) {
  const { query } = req.body;
  const page = parseInt(req.query["page"] as string) || 1;
  const limit = parseInt(req.query["limit"] as string) || 10;
  const skip = (page - 1) * limit;

  if (!query) {
    res.status(400).json({ error: "query is required." });
    return;
  }

  let filters: any = {};

  try {
    filters = await searchChain.invoke({ query });
  } catch (error: any) {
    handleAIError(error, res);
    return;
  }

  if (!filters.location && !filters.type && !filters.guests && !filters.maxPrice) {
    res.status(400).json({
      error: "Could not extract any filters from your query, please be more specific.",
    });
    return;
  }

  const where: any = {};
  if (filters.location) where.location = { contains: filters.location, mode: "insensitive" };
  if (filters.type) where.type = filters.type;
  if (filters.guests) where.guests = { gte: filters.guests };
  if (filters.maxPrice) where.pricePerNight = { lte: filters.maxPrice };

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      skip,
      take: limit,
      include: { host: { select: { name: true, email: true } } },
    }),
    prisma.listing.count({ where }),
  ]);

  res.status(200).json({
    filters,
    data: listings,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}



const toneInstructions: Record<string, string> = {
  professional: "Write in a formal, clear, business-like tone. Be precise and informative.",
  casual: "Write in a friendly, relaxed, conversational tone. Be warm and approachable.",
  luxury: "Write in an elegant, premium, aspirational tone. Use rich descriptive language.",
};

const descriptionPrompt = ChatPromptTemplate.fromTemplate(`
You are a professional copywriter for an Airbnb-like platform.
{toneInstruction}

Write an engaging listing description for this property:
- Title: {title}
- Location: {location}
- Type: {type}
- Max guests: {guests}
- Amenities: {amenities}
- Price per night: ${"{price}"} USD

Write 2-3 paragraphs, 100-150 words total.
Return ONLY the description text. No labels, no markdown, no intro like "Here is the description:".
`);

const descriptionChain = descriptionPrompt.pipe(model).pipe(new StringOutputParser());

export async function generateDescription(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { tone = "professional" } = req.body;

  const validTones = ["professional", "casual", "luxury"];
  if (!validTones.includes(tone)) {
    res.status(400).json({ error: 'tone must be "professional", "casual", or "luxury".' });
    return;
  }

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) {
    res.status(404).json({ error: "Listing not found." });
    return;
  }

  if (listing.hostId !== req.userId && req.role !== "ADMIN") {
    res.status(403).json({ error: "You can only generate descriptions for your own listings." });
    return;
  }

  let description: string;

  try {
    description = await descriptionChain.invoke({
      toneInstruction: toneInstructions[tone],
      title: listing.title,
      location: listing.location,
      type: listing.type,
      guests: listing.guests,
      amenities: listing.amenities.join(", "),
      price: listing.pricePerNight,
    });
  } catch (error: any) {
    handleAIError(error, res);
    return;
  }

  const updatedListing = await prisma.listing.update({
    where: { id },
    data: { description: description.trim() },
  });

  clearCache("all_listings");

  res.status(200).json({
    description: description.trim(),
    listing: updatedListing,
  });
}

const sessionHistories = new Map<string, Array<{ role: string; content: string }>>();

export async function chat(req: Request, res: Response) {
  const { message, sessionId, listingId } = req.body;

  if (!message || !sessionId) {
    res.status(400).json({ error: "message and sessionId are required." });
    return;
  }

  if (!sessionHistories.has(sessionId)) {
    sessionHistories.set(sessionId, []);
  }

  const history = sessionHistories.get(sessionId)!;

  let systemContent = `You are a helpful guest support assistant for an Airbnb-like platform.
Be friendly, concise, and helpful. If you don't know something, say so.`;

  if (listingId) {
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (listing) {
      systemContent = `You are a helpful guest support assistant for an Airbnb-like platform.
You are currently helping a guest with questions about this specific listing:

Title: ${listing.title}
Location: ${listing.location}
Price per night: $${listing.pricePerNight} USD
Max guests: ${listing.guests}
Type: ${listing.type}
Amenities: ${listing.amenities.join(", ")}
Description: ${listing.description}

Answer questions about this listing accurately based on the details above.
If asked something not covered by the listing details, say you don't have that information.`;
    }
  }

  history.push({ role: "user", content: message });

  const trimmedHistory = history.length > 20 ? history.slice(history.length - 20) : history;
  sessionHistories.set(sessionId, trimmedHistory);

  const messages = [
    new SystemMessage(systemContent),
    ...trimmedHistory.slice(0, -1).map((m) =>
      m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
    ),
    new HumanMessage(message),
  ];

  let reply: string;

  try {
    const response = await model.invoke(messages);
    reply = typeof response.content === "string" ? response.content : String(response.content);
  } catch (error: any) {
    handleAIError(error, res);
    return;
  }

  trimmedHistory.push({ role: "assistant", content: reply });
  sessionHistories.set(sessionId, trimmedHistory);

  res.status(200).json({
    response: reply,
    sessionId,
    messageCount: trimmedHistory.length,
  });
}

const recommendPrompt = ChatPromptTemplate.fromTemplate(`
You are a travel recommendation assistant for an Airbnb-like platform.
Analyze this user's booking history and suggest what kind of listings they would enjoy next.

Booking history:
{bookingHistory}

Return ONLY valid JSON with no explanation and no markdown in this exact format:
{{
  "preferences": "string describing what the user likes based on their history",
  "searchFilters": {{
    "location": "string or null",
    "type": "string or null",
    "maxPrice": number or null,
    "guests": number or null
  }},
  "reason": "short explanation of why these filters match the user"
}}
`);

const recommendChain = recommendPrompt.pipe(strictModel).pipe(new JsonOutputParser());

export async function getRecommendations(req: AuthRequest, res: Response) {
  const bookings = await prisma.booking.findMany({
    where: { guestId: req.userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { listing: true },
  });

  if (bookings.length === 0) {
    res.status(400).json({
      error: "No booking history found. Make some bookings first to get recommendations.",
    });
    return;
  }

  const bookingHistory = bookings
    .map(
      (b) =>
        `- ${b.listing.title} in ${b.listing.location}, ${b.listing.type}, $${b.listing.pricePerNight}/night, ${b.listing.guests} guests max`
    )
    .join("\n");

  let aiResult: any;

  try {
    aiResult = await recommendChain.invoke({ bookingHistory });
  } catch (error: any) {
    handleAIError(error, res);
    return;
  }

  const { preferences, searchFilters, reason } = aiResult;

  const bookedListingIds = bookings.map((b) => b.listingId);

  const where: any = { id: { notIn: bookedListingIds } };
  if (searchFilters?.location) where.location = { contains: searchFilters.location, mode: "insensitive" };
  if (searchFilters?.type) where.type = searchFilters.type;
  if (searchFilters?.maxPrice) where.pricePerNight = { lte: searchFilters.maxPrice };
  if (searchFilters?.guests) where.guests = { gte: searchFilters.guests };

  const recommendations = await prisma.listing.findMany({
    where,
    take: 5,
    include: { host: { select: { name: true, email: true } } },
  });

  res.status(200).json({
    preferences,
    reason,
    searchFilters,
    recommendations,
  });
}

const reviewSummaryPrompt = ChatPromptTemplate.fromTemplate(`
You are an analyst summarizing guest reviews for an Airbnb-like platform.

Here are the reviews for this listing:
{reviews}

Return ONLY valid JSON with no explanation and no markdown in this exact format:
{{
  "summary": "2-3 sentence overall summary of guest experience",
  "positives": ["thing guests praised 1", "thing guests praised 2", "thing guests praised 3"],
  "negatives": ["complaint 1"]
}}

If there are no negatives, return an empty array for negatives.
`);

const reviewSummaryChain = reviewSummaryPrompt.pipe(strictModel).pipe(new JsonOutputParser());

export async function getReviewSummary(req: Request, res: Response) {
  const { id } = req.params;

  const cacheKey = `review_summary_${id}`;
  const cached = getCache(cacheKey);
  if (cached) {
    res.status(200).json(cached);
    return;
  }

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) {
    res.status(404).json({ error: "Listing not found." });
    return;
  }

  const reviews = await prisma.review.findMany({
    where: { listingId: id },
    include: { user: { select: { name: true } } },
  });

  if (reviews.length < 3) {
    res.status(400).json({
      error: "Not enough reviews to generate a summary (minimum 3 required).",
    });
    return;
  }

  const reviewsText = reviews
    .map((r) => `- ${r.user.name} rated ${r.rating}/5: "${r.comment}"`)
    .join("\n");

  const averageRating =
    Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10;

  let aiResult: any;

  try {
    aiResult = await reviewSummaryChain.invoke({ reviews: reviewsText });
  } catch (error: any) {
    handleAIError(error, res);
    return;
  }

  const result = {
    summary: aiResult.summary,
    positives: aiResult.positives,
    negatives: aiResult.negatives,
    averageRating,
    totalReviews: reviews.length,
  };

  setCache(cacheKey, result, 600); 
  res.status(200).json(result);
}