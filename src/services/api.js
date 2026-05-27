// Stub API service - all functions return mock data
// Real API integration will be added later when backend is connected

export const generateSermon = async (passage, topic) => {
  return {
    title: `Sermon on ${topic}`,
    content: 'AI coming soon — backend not connected yet',
  };
};

export const generatePrayer = async (type) => {
  return {
    type,
    prayer: 'Prayer generator coming soon',
  };
};

export const generatePost = async (topic, platform) => {
  return {
    platform,
    content: 'Social media content coming soon',
  };
};

export const generateAiChat = async (message) => {
  return {
    response: 'AI chat coming soon — backend not connected yet',
  };
};

export const getAnnouncements = async () => {
  return [];
};

export const getBulletin = async () => {
  return null;
};

export default {
  generateSermon,
  generatePrayer,
  generatePost,
  generateAiChat,
  getAnnouncements,
  getBulletin,
};
