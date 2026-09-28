export function buildShareText(name = "My child") {
  const safeName = String(name || "My child").trim() || "My child";

  return `Hi! I’m joining Starly and my child ${safeName} is ready to shine. Join my star link and unlock an exclusive gift!`;
}

function attachShareParams(pageUrl, imageUrl, description) {
  void imageUrl;
  void description;

  return pageUrl;
}

export function buildShareLinks(pageUrl, shareText, imageUrl, description) {
  const shareUrl = attachShareParams(pageUrl, imageUrl, description);

  if (!shareUrl) {
    return {
      whatsapp: "",
      facebook: "",
      instagram: "",
      imageUrl: "",
    };
  }

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(shareText || buildShareText());

  return {
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
    instagram: `https://www.instagram.com/?url=${encodedUrl}`,
    imageUrl: String(imageUrl ?? "").trim(),
  };
}
