export function buildShareText(name = "My child") {
  const safeName = String(name || "My child").trim() || "My child";

  return `Hi! I’m joining Starly and my child ${safeName} is ready to shine. Join my star link and unlock an exclusive gift!`;
}

function attachImageToShareUrl(pageUrl: string, imageUrl?: string) {
  const trimmedImage = String(imageUrl ?? "").trim();

  if (!pageUrl || !trimmedImage) {
    return pageUrl;
  }

  const separator = pageUrl.includes("?") ? "&" : "?";
  return `${pageUrl}${separator}image=${trimmedImage}`;
}

export function buildShareLinks(pageUrl: string, shareText: string, imageUrl?: string) {
  const shareUrl = attachImageToShareUrl(pageUrl, imageUrl);

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
