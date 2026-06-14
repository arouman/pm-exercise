import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// A small "more info" affordance: an info icon that reveals explanatory text on hover/focus.
// Used to keep section descriptions out of the layout — the heading stays clean, the methodology
// note lives one hover away. Place next to a page or card heading.
export default function InfoHint({ text, label = 'More information', size = 'small' }) {
  return (
    <Tooltip title={text} arrow placement="top" enterTouchDelay={0}>
      <IconButton size={size} aria-label={label} sx={{ color: 'text.disabled', p: 0.25 }}>
        <InfoOutlinedIcon fontSize="inherit" />
      </IconButton>
    </Tooltip>
  );
}
