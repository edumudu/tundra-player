import { useRef, useState, useEffect, ChangeEvent, SyntheticEvent, useCallback, useMemo } from 'react';
import { PlayArrow, Pause, VolumeUp, VolumeDown, VolumeMute, VolumeOff, PictureInPicture, Fullscreen, FullscreenExit, Loop, CancelOutlined } from '@material-ui/icons'
import { createStyles, withStyles, Theme } from '@material-ui/core/styles';
import { IconButton } from '@material-ui/core'
import Slider from '@material-ui/core/Slider'
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import InputBase from '@material-ui/core/InputBase';

import styles from './styles.module.css';

let showControlsBarTimeout: NodeJS.Timeout;

const allowedPLaybackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4]

const BootstrapInput = withStyles((theme: Theme) =>
createStyles({
  root: {
    'label + &': {
      marginTop: theme.spacing(3),
    },
  },
  input: {
    borderRadius: 4,
    position: 'relative',
    backgroundColor: 'transparent',
    fontSize: 13,
    transition: theme.transitions.create(['border-color', 'box-shadow']),
    // Use the system font instead of the default Roboto font.
    '&:focus': {
      borderRadius: 4,
      backgroundColor: 'transparent',
    },
  },
}),
)(InputBase);

export function MediaPlayer() {
  const media = useRef<HTMLVideoElement>(null);
  const [isPaused, setIsPaused] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [mediaDuration, setMediaDuration] = useState(0);
  const [showControlsBar, setShowControlsBar] = useState(true);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [hasLoadedMetaData, setHasLoadedMetaData] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);

  const [fileUrlSrc, setFileUrlSrc] = useState('');

  useEffect(() => {
    hideControlsBar();

    /// @ts-ignore
    window.api.receive('fileOpened', (file: Buffer) => {
      const blob = new Blob([file], { type: 'video/mp4' });

      setFileUrlSrc(URL.createObjectURL(blob))
    });
  }, []);

  useEffect(() => {
    (media.current as HTMLVideoElement).playbackRate = playbackRate;
  }, [playbackRate])

  useEffect(() => {
    if(isPaused) media.current?.pause();
    else media.current?.play();
  }, [isPaused])

  useEffect(() => {
    (media.current as HTMLVideoElement).volume = volume;
  }, [volume])

  const secondsToTime = (totalSeconds: number) => {
    const truncatedSeconds = Math.floor(totalSeconds)
    const seconds = truncatedSeconds % 60;
    const minutes = Math.floor(truncatedSeconds / 60);
    const hours = Math.floor(minutes / 60);

    const padNumber = (n: number) => String(n).padStart(2, '0');

    return hours < 1
      ? `${padNumber(minutes)}:${padNumber(seconds)}`
      : `${padNumber(hours)}:${padNumber(minutes)}:${padNumber(seconds)}`;
  }

  const playPauseMedia = () => {
    setIsPaused(!isPaused);
  }

  const stopMedia = () => {
    setIsPaused(true);
    setMediaTime(0);
  }

  const setMediaTime = (seconds: number) => {
    (media.current as HTMLVideoElement).currentTime = seconds;
  }

  const onTimeUpdate = () => {
    setCurrentTime(media.current?.currentTime || 0);
  }

  const handleChange = (_: ChangeEvent<{}>, value: number | number[]) => {
    setMediaTime(Array.isArray(value) ? value[0] : value);
  }

  const handleMetaDataLoad = (e: SyntheticEvent<HTMLVideoElement, Event>) => {
    setMediaDuration(media.current?.duration || 0)
    setHasLoadedMetaData(true);
  }

  const hideControlsBar = () => {
    clearTimeout(showControlsBarTimeout);
    showControlsBarTimeout = setTimeout(() => setShowControlsBar(false), 600)
  };

  const unhideControlsBar = () => {
    clearTimeout(showControlsBarTimeout);
    setShowControlsBar(true);
  }

  const requestPictureIn = async () => {
    /// @ts-ignore
    await media.current?.requestPictureInPicture();
    /// @ts-ignore
    document.pictureInPictureElement.addEventListener('leavepictureinpicture', onLeavepictureinpicture);
    /// @ts-ignore
    window.api.send('hideWindow');
  }

  const onLeavepictureinpicture = () => {
    /// @ts-ignore
    window.api.send('showWindow');
  }
  
  const toggleFullScreen = async () => {
    setIsFullscreen(!isFullscreen);
    /// @ts-ignore
    window.api.send('toggleFullScreen');
  }

  const shortcutsActions: Record<string, (e: KeyboardEvent) => void> = {
    Space(e) {
      e.preventDefault();

      if(e.ctrlKey || e.altKey) return;

      playPauseMedia();
    },

    ArrowUp(e) {
      setVolume(Math.min(1, volume + 0.1));
    },

    ArrowDown(e) {
      setVolume(Math.max(0, volume - 0.1));
    },

    ArrowLeft(e) {
      setMediaTime(Math.max(0, currentTime - 0.1));
    },
    
    ArrowRight(e) {
      setMediaTime(Math.min(mediaDuration, currentTime + 0.1));
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keyhandler = shortcutsActions[e.code];
  
      keyhandler && hasLoadedMetaData && keyhandler(e);
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  })

  return (
    <div className={styles.mediaPlayerContainer}>
      <video
        ref={media}
        className={styles.video}
        preload="metadata"
        src={fileUrlSrc}
        loop={isLooping}
        onEnded={stopMedia}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={handleMetaDataLoad}
      />

      <div
        className={styles.controlsBar}
        style={{ opacity: showControlsBar ? 1 : 0 }}
        onMouseLeave={hideControlsBar}
        onMouseEnter={unhideControlsBar}
      >
        <div className={styles.mediaTimeSliderWrapper}>
          <Slider
            defaultValue={0}
            min={0}
            max={mediaDuration}
            step={0.1}
            disabled={!hasLoadedMetaData}
            value={currentTime}
            onChange={handleChange}
          />
        </div>

        <div className={styles.controls}>
          <div>
            <IconButton onClick={playPauseMedia} disabled={!hasLoadedMetaData}>
              {isPaused ? <PlayArrow /> : <Pause />}
            </IconButton>

            <div
              className={styles.mediaVolume}
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <IconButton onClick={() => setVolume(volume > 0 ? 0 : 1)} disabled={!hasLoadedMetaData}>
                {volume > 0.7
                  ? <VolumeUp />
                  : volume > 0.3
                  ? <VolumeDown />
                  : volume > 0
                  ? <VolumeMute />
                  : <VolumeOff />
                }
              </IconButton>

              <div className={`${styles.volumeSlider} ${showVolumeSlider ? styles.volumeSliderShow : ''}`}>
                <Slider
                  defaultValue={0}
                  min={0}
                  max={1}
                  step={0.1}
                  disabled={!hasLoadedMetaData}
                  value={volume}
                  onChange={(_, value) => setVolume(Array.isArray(value) ? value[0] : value)}
                />
              </div>
            </div>

            <div className={styles.mediaTimes}>
              <span>{secondsToTime(currentTime)}</span>
              /
              <span>{secondsToTime(mediaDuration)}</span>
            </div>
          </div>

          <div>
            <FormControl>
              <Select
                input={<BootstrapInput />}
                disabled={!hasLoadedMetaData}
                value={playbackRate}
                onChange={(e) => setPlaybackRate(Number(e.target.value))}
              >
                {allowedPLaybackRates.map(rate => <MenuItem value={rate} key={rate}>{rate}x</MenuItem>)}
              </Select>
            </FormControl>

            <IconButton onClick={() => setIsLooping(!isLooping)} disabled={!hasLoadedMetaData}>
              {isLooping ? <CancelOutlined /> : <Loop />}
            </IconButton>

            <IconButton onClick={requestPictureIn} disabled={!hasLoadedMetaData}>
              <PictureInPicture />
            </IconButton>

            <IconButton onClick={toggleFullScreen} disabled={!hasLoadedMetaData}>
              {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
          </div>
        </div>
      </div>
    </div>
  );
}