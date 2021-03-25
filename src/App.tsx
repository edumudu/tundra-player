import CssBaseline from '@material-ui/core/CssBaseline';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';

import { MediaPlayer } from './components/MediaPlayer';

const darkTheme = createMuiTheme({
  palette: {
    type: 'dark',
  },
});

export function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <MediaPlayer />
    </ThemeProvider>)
}