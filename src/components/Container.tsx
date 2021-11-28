import React, { useContext, useState, useRef, useEffect } from 'react'
import GlobalContext from './../context/Global'
import StoriesContext from './../context/Stories'
import ProgressContext from './../context/Progress'
import Story from './Story'
import ProgressArray from './ProgressArray'
import { GlobalCtx, StoriesContext as StoriesContextInterface } from './../interfaces'
import UnmutedSVG from './../assets/unmuted.svg';
import MutedSVG from './../assets/muted.svg';



export default function () {
    const [currentId, setCurrentId] = useState<number>(0)
    const [pause, setPause] = useState<boolean>(true)
    const [muted, setMuted] = useState<boolean>(true)
    const [bufferAction, setBufferAction] = useState<boolean>(true)
    const [videoDuration, setVideoDuration] = useState<number>(0)

    let mousedownId = useRef<any>();
    let isMounted = useRef<boolean>(true);

    const { width, height, loop, currentIndex, isPaused, keyboardNavigation, preventDefault, storyContainerStyles = {} } = useContext<GlobalCtx>(GlobalContext);
    const { stories } = useContext<StoriesContextInterface>(StoriesContext);

    useEffect(() => {
        if (typeof currentIndex === 'number') {
            if (currentIndex >= 0 && currentIndex < stories.length) {
                setCurrentIdWrapper(() => currentIndex)
            } else {
                console.error('Index out of bounds. Current index was set to value more than the length of stories array.', currentIndex)
            }
        }
    }, [currentIndex])

    useEffect(() => {
        if (typeof isPaused === 'boolean') {
            setPause(isPaused)
        }
    }, [isPaused])

    useEffect(() => {
        const isClient = (typeof window !== 'undefined' && window.document);
        if (isClient && (typeof keyboardNavigation === 'boolean' && keyboardNavigation)) {
            document.addEventListener("keydown", handleKeyDown);
            return () => {
                document.removeEventListener("keydown", handleKeyDown);
            }
        }
    }, [keyboardNavigation]);

    // Cleanup mounted state - for issue #130 (https://github.com/mohitk05/react-insta-stories/issues/130)
    useEffect(() => {
        return () => {
            isMounted.current = false;
        }
    }, []);

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft') {
            previous()
        }
        else if (e.key === 'ArrowRight') {
            next()
        }
    }

    const toggleState = (action: string, bufferAction?: boolean) => {
        setPause(action === 'pause')
        setBufferAction(!!bufferAction)
    }

    const setCurrentIdWrapper = (callback) => {
        setCurrentId(callback);
        toggleState('pause', true);
    }

    const previous = () => {
        setCurrentIdWrapper(prev => prev > 0 ? prev - 1 : prev)
    }

    const next = () => {
        if (isMounted.current) {
            if (loop) {
                updateNextStoryIdForLoop()
            } else {
                updateNextStoryId()
            }
        }
    };

    const updateNextStoryIdForLoop = () => {
        setCurrentIdWrapper(prev => (prev + 1) % stories.length)
    }

    const updateNextStoryId = () => {
        setCurrentIdWrapper(prev => {
            if (prev < stories.length - 1) return prev + 1
            return prev
        })
    }

    const debouncePause = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault()
        mousedownId.current = setTimeout(() => {
            toggleState('pause')
        }, 200)
    }

    const mouseUp = (type: string) => (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault()
        mousedownId.current && clearTimeout(mousedownId.current)
        if (pause) {
            toggleState('play')
        } else {
            type === 'next' ? next() : previous()
        }
    }

    const toggleMute = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault()
        if (muted) {
            setMuted(false)
        } else {
            setMuted(true)
        }
    }

    const getVideoDuration = (duration: number) => {
        setVideoDuration(duration * 1000)
    }

    return (
        <div style={{ ...storyContainerStyles, ...styles.container, ...{ width, height } }}>
            <ProgressContext.Provider value={{
                bufferAction: bufferAction,
                videoDuration: videoDuration,
                currentId,
                pause,
                next
            }}>
                <ProgressArray />
            </ProgressContext.Provider>
            <Story
                action={toggleState}
                bufferAction={bufferAction}
                playState={pause}
                muteState={muted}
                story={stories[currentId]}
                getVideoDuration={getVideoDuration}
            // Add props to send to story for more control
            />
            {!preventDefault && <div style={styles.overlay}>
                <div style={{ width: '50%', zIndex: 999 }} onTouchStart={debouncePause} onTouchEnd={mouseUp('previous')} onMouseDown={debouncePause} onMouseUp={mouseUp('previous')} />
                <div style={{ width: '50%', zIndex: 999 }} onTouchStart={debouncePause} onTouchEnd={mouseUp('next')} onMouseDown={debouncePause} onMouseUp={mouseUp('next')} />
                {stories[currentId].type === "video" &&
                    <div style={styles.volume} onClick={toggleMute}>{muted ? <MutedSVG height="3em" width="3em"/>: <UnmutedSVG height="3em" width="3em"/>}</div>
                }
            </div>}
        </div>
    )
}

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        background: '#111',
        position: 'relative'
    },
    overlay: {
        position: 'absolute',
        height: 'inherit',
        width: 'inherit',
        display: 'flex'
    },
    volume: {
        zIndex: 999,
        position: "absolute",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        width: "6em",
        height: "6em",
        borderRadius: "50%",
        bottom: 50,
        right: 50,
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
    }
}