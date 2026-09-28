import test from "node:test";
import assert from "node:assert/strict";

import { buildShareLinks, buildShareText } from "./share.ts";

test("share text includes the child name and exclusive gift message", () => {
  const text = buildShareText("Ava");

  assert.match(text, /Ava/);
  assert.match(text, /exclusive gift/i);
});

test("share links are generated with encoded URL and text", () => {
  const links = buildShareLinks("https://example.com/join?code=abc123", "Hello from Starly");

  assert.match(links.whatsapp, /^https:\/\/wa\.me\//);
  assert.match(links.facebook, /facebook\.com\/sharer\/sharer\.php/);
  assert.ok(links.whatsapp.includes(encodeURIComponent("Hello from Starly")));
  assert.ok(links.facebook.includes(encodeURIComponent("https://example.com/join?code=abc123")));
});

test("share links keep the canonical page URL instead of leaking image params", () => {
  const imageUrl = "https://example.com/star-card.jpg";
  const links = buildShareLinks("https://example.com/join?code=abc123", "Hello from Starly", imageUrl);

  assert.ok(links.whatsapp.includes(encodeURIComponent("https://example.com/join?code=abc123")));
  assert.ok(!links.whatsapp.includes(encodeURIComponent(imageUrl)));
  assert.ok(!links.facebook.includes(encodeURIComponent(imageUrl)));
});

test("share links keep the canonical page URL when custom description is provided", () => {
  const imageUrl = "https://example.com/star-card.jpg";
  const description = "Vote for Ava and help her shine";
  const links = buildShareLinks(
    "https://example.com/join?code=abc123",
    "Hello from Starly",
    imageUrl,
    description,
  );

  assert.ok(links.whatsapp.includes(encodeURIComponent("https://example.com/join?code=abc123")));
  assert.ok(!links.whatsapp.includes(encodeURIComponent(description)));
  assert.ok(!links.facebook.includes(encodeURIComponent(description)));
});
