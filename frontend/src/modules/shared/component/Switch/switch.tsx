import { createTheme, ThemeProvider } from '@mui/material/styles';
import Switch from '@mui/material/Switch';

const customTheme = createTheme({
  components: {
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          // Controls default (unchecked) color for the thumb
          color: '#ccc', 
          '&.Mui-checked': {
            // Controls checked color for the thumb
            color: '#f2ff00', 
          },
        },
        track: {
          // Controls default (unchecked) color for the track
          opacity: 0.2,
          backgroundColor: '#fff',
          '&.Mui-checked': {
            // Controls checked color for the track
            opacity: 0.7,
            backgroundColor: '#fff',
          },
        },
      },
    },
  },
});

function SwitchButton() {
  return (
    <ThemeProvider theme={customTheme}>
      <Switch defaultChecked />
    </ThemeProvider>
  );
}

export default SwitchButton;
