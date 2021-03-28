import { useEffect, useState } from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';

import { MediaPlayer } from './components/MediaPlayer';

const darkTheme = createMuiTheme({
  palette: {
    type: 'dark',
  },
});

export function App() {
  const [fileUrlSrc, setFileUrlSrc] = useState('');

  useEffect(() => {
    window.api.receive('fileOpened', (filePath: string) => {
      setFileUrlSrc(`atom:${filePath}`);  
    });
  }, []);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <MediaPlayer src={fileUrlSrc} key={fileUrlSrc} />
    </ThemeProvider>);
}