import { useEffect, useState } from "react";
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  ListItemText,
  Divider,
  Typography,
  Tooltip,
} from "@mui/material";
import { Bell } from "lucide-react";

type Notification = {
  id: string;
  title: string;
  body?: string;
  created_at: string;
  read?: boolean;
  source?: string;
};

function useNotifications() {
  const [items, setItems] = useState<Notification[]>([]);

  useEffect(() => {
    let mounted = true;
    let es: EventSource | null = null;

    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (!mounted) return;
        setItems(Array.isArray(data) ? data : []);
      })
      .catch(() => {});


    try {
      es = new EventSource("/api/notifications/sse");
      es.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          const notif: Notification = payload.notification ?? payload;
          setItems((prev) => [notif, ...prev]);
        } catch (err) {

        }
      };
      es.onerror = () => {
        es?.close();
        es = null;
      };
    } catch (err) {
      es = null;
    }

    return () => {
      mounted = false;
      es?.close();
    };
  }, []);

  const markAllRead = () => setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  const markRead = (id: string) => setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

  return { items, markAllRead, markRead } as const;
}

export function NotificationsBell() {
  const { items, markAllRead, markRead } = useNotifications();
  const unread = items.filter((i) => !i.read).length;
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const open = Boolean(anchor);

  return (
    <>
      <Tooltip title="Notificações">
        <IconButton size="small" onClick={(e) => setAnchor(e.currentTarget)} aria-label="Notificações">
          <Badge badgeContent={unread} color="error" showZero={false}>
            <Bell className="size-4" />
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchor}
        open={open}
        onClose={() => setAnchor(null)}
        sx={{ "& .MuiPaper-root": { minWidth: 320, maxWidth: 420 } }}
      >
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <Typography variant="subtitle1">Notificações</Typography>
          <Typography
            variant="caption"
            onClick={() => markAllRead()}
            style={{ cursor: "pointer", color: "#888", marginLeft: 12 }}
          >
            Marcar todas como lida
          </Typography>
        </div>

        <Divider />

        {items.length === 0 && (
          <MenuItem disabled className="py-6">
            Sem notificações
          </MenuItem>
        )}

        <div style={{ maxHeight: 320, overflow: "auto" }}>
          {items.map((n) => (
            <MenuItem
              key={n.id}
              onClick={() => {
                markRead(n.id);
                setAnchor(null);
              }}
              dense
              selected={!n.read}
            >
              <ListItemText
                primary={n.title}
                secondary={
                  <span className="text-xs">
                    {n.body} · {new Date(n.created_at).toLocaleString("pt-BR")}
                  </span>
                }
              />
            </MenuItem>
          ))}
        </div>
      </Menu>
    </>
  );
}

export default NotificationsBell;
