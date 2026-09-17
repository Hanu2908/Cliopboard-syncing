interface EncryptedClipboardItem {
  id: string;
  encryptedPayload: string;
  iv: string;
  salt: string;
  contentType: string;
  timestamp: number;
  senderId: string;
  senderName?: string;
  pinned?: boolean;
}

const serverlessRoomStore = new Map<string, EncryptedClipboardItem[]>();

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { roomCode } = req.query;
  const normalized = typeof roomCode === 'string' ? roomCode.toUpperCase() : 'DEFAULT';

  if (!serverlessRoomStore.has(normalized)) {
    serverlessRoomStore.set(normalized, []);
  }
  const items = serverlessRoomStore.get(normalized)!;

  if (req.method === 'POST') {
    const item = req.body as EncryptedClipboardItem;
    if (!item || !item.id || !item.encryptedPayload) {
      return res.status(400).json({ error: 'Invalid clipboard payload' });
    }
    const idx = items.findIndex((i) => i.id === item.id);
    if (idx >= 0) {
      items[idx] = item;
    } else {
      items.unshift(item);
      if (items.length > 60) {
        items.pop();
      }
    }
    return res.status(200).json({ success: true, count: items.length });
  }

  // GET
  return res.status(200).json({
    items,
    devices: [],
    count: items.length,
  });
}
