import { Request, Response } from "express";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser, StringOutputParser } from "@langchain/core/output_parsers";
import { model, strictModel } from "../config/ai.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import prisma from "../config/prisma.js";

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
    if (error?.status === 429) {
      res.status(429).json({ error: "AI service is busy, please try again in a moment." });
      return;
    }
    res.status(500).json({ error: "AI service configuration error." });
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