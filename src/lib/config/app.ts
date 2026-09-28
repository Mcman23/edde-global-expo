/**
 * Application configuration for EDDE Global Expo
 * NOTE: The WhatsApp phone number MUST be configured via environment variable NEXT_PUBLIC_WHATSAPP_NUMBER.
 */

export const APP = {
  // Configurable via env ONLY - fallback to default demo number if env is omitted
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '994501234567',

  /**
   * Generates the pre-filled WhatsApp chat message template
   */
  whatsappMessage(name: string, destination: string): string {
    const cleanName = name?.trim() || 'a student';
    const cleanDest = destination?.trim() || 'a global destination';
    return `Hello EDDE Global! I'm ${cleanName}. At the expo I completed your destination quiz — my match was ${cleanDest}. I'd like to claim my expo benefit and speak to an advisor.`;
  },

  /**
   * Generates full wa.me link with URL-encoded message
   */
  getWhatsAppUrl(name: string, destination: string): string {
    const rawNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || APP.whatsappNumber;
    const cleanNumber = rawNumber.replace(/[^0-9]/g, '');
    const messageText = APP.whatsappMessage(name, destination);
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(messageText)}`;
  },
};
