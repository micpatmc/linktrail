// Get the current page favicon
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "extractFavicon") {
    const favicon =
        document.querySelector("link[rel='icon']") ||
        document.querySelector("link[rel='shortcut icon']") ||
        document.querySelector("link[rel='apple-touch-icon']") ||
        document.querySelector("link[rel='apple-touch-icon-precomposed']") ||
        document.querySelector("meta[itemprop='image']") ||
        document.querySelector("meta[name='msapplication-TileImage']") ||
        document.querySelector("meta[name='theme-color']") ||
        document.querySelector("link[rel='icon'][href='/favicon.ico']") ||
        document.querySelector("link[rel='icon'][href='/favicon.png']");
    const faviconUrl = favicon ? favicon.href : null;
    sendResponse(faviconUrl);
  }
});
