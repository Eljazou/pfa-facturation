import { memo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  IconButton, Badge, Popover, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Typography, Box, Button, Divider, Tooltip,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PaidIcon from '@mui/icons-material/Paid';
import { markAsRead as markAsReadAction, markAllAsRead as markAllAsReadAction } from '../features/notifications/notificationsSlice';
import { markNotificationRead, markAllNotificationsRead } from '../services/notificationService';
import { formatDistanceToNow } from '../utils/timeFormat';

const ICON_BY_TYPE = {
  invoice_submitted:       { Icon: HourglassEmptyIcon, color: 'warning.main' },
  invoice_validated:       { Icon: CheckCircleIcon,    color: 'success.main' },
  invoice_validated_admin: { Icon: CheckCircleIcon,    color: 'success.main' },
  invoice_rejected:        { Icon: CancelIcon,         color: 'error.main'   },
  invoice_rejected_admin:  { Icon: CancelIcon,         color: 'error.main'   },
  invoice_paid:            { Icon: PaidIcon,           color: 'info.main'    },
};

function NotificationBell() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const notifications = useSelector((s) => s.notifications.notifications);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const [anchorEl, setAnchorEl] = useState(null);

  if (!user) return null;

  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleClick = async (n) => {
    if (!n.read) {
      dispatch(markAsReadAction(n.id));
      try { await markNotificationRead(user.uid, n); } catch { /* ignore */ }
    }
    handleClose();
    if (n.invoiceId) navigate(`/invoices/${n.invoiceId}`);
  };

  const handleMarkAll = async () => {
    dispatch(markAllAsReadAction());
    try { await markAllNotificationsRead(user.uid, notifications); } catch { /* ignore */ }
  };

  const last10 = notifications.slice(0, 10);

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          onClick={handleOpen}
          size="medium"
          sx={{ color: 'text.secondary' }}
        >
          <Badge
            badgeContent={unreadCount}
            color="error"
            overlap="circular"
            max={99}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            sx={{
              '& .MuiBadge-badge': {
                top: 4,
                right: 4,
                minWidth: 16,
                height: 16,
                fontSize: 10,
                padding: '0 4px',
                border: '2px solid white',
              },
            }}
          >
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { width: 360, maxHeight: 480 } }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography fontWeight={600}>Notifications</Typography>
          {unreadCount > 0 && (
            <Typography variant="caption" color="text.secondary">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</Typography>
          )}
        </Box>
        <Divider />
        {last10.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary" variant="body2">Aucune notification</Typography>
          </Box>
        ) : (
          <List dense sx={{ p: 0, maxHeight: 360, overflow: 'auto' }}>
            {last10.map((n) => {
              const meta = ICON_BY_TYPE[n.type] || ICON_BY_TYPE.invoice_submitted;
              const { Icon } = meta;
              return (
                <ListItem key={n.id} disablePadding>
                  <ListItemButton
                    onClick={() => handleClick(n)}
                    sx={{
                      bgcolor: n.read ? 'transparent' : 'action.hover',
                      borderLeft: n.read ? 'none' : '3px solid',
                      borderColor: 'primary.main',
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Icon fontSize="small" sx={{ color: meta.color }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={n.message}
                      primaryTypographyProps={{
                        fontSize: 13,
                        fontWeight: n.read ? 400 : 600,
                      }}
                      secondary={formatDistanceToNow(n.createdAt)}
                      secondaryTypographyProps={{ fontSize: 11 }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        )}
        {last10.length > 0 && unreadCount > 0 && (
          <>
            <Divider />
            <Box sx={{ p: 1, textAlign: 'center' }}>
              <Button size="small" onClick={handleMarkAll}>Tout marquer comme lu</Button>
            </Box>
          </>
        )}
      </Popover>
    </>
  );
}

export default memo(NotificationBell);
