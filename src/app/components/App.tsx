import * as React from 'react';
import styles from './app.module.scss';
import {Button, Icon} from './elements';
import calculateSize from 'calculate-size';
import {calculateAspectRatioFit, copyfromClipBoard} from './../../utils';

// Modes obj for each type of scaling
const scaleModes = [
    {
        name: 'scale',
        units: '@x',
        default: 2,
        min: 0,
        max: 16,
        length: 4,
    },
    {
        name: 'width',
        units: 'px',
        default: 2000,
        min: 0,
        max: 10000,
        length: 5,
    },
    {
        name: 'height',
        units: 'px',
        default: 2000,
        min: 0,
        max: 10000,
        length: 5,
    },
];

// Convert Image to the ArrayBuffer type
const imageToArrayBuffer = (canvas: HTMLCanvasElement): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) =>
        canvas.toBlob(async d => {
            if (d) {
                const result = new FileReader();
                result.addEventListener('loadend', () => {
                    resolve(new Uint8Array(result.result as ArrayBuffer));
                });
                result.addEventListener('error', e => {
                    reject(e);
                });
                result.readAsArrayBuffer(d);
            } else {
                reject(new Error('Expected toBlob() to be defined'));
            }
        })
    );
};

// prepare SVG string for Figma Image
const prepareSVGforFigma = (svgString, modes, currentMode, val) => {
    // Check which scake mode is selected
    const checkScaleMode = (size, dimension) => {
        if (modes[currentMode].name === modes[0].name) {
            return size[dimension] * val;
        } else {
            return calculateAspectRatioFit(size.width, size.height, val)[dimension];
        }
    };

    // Paste SVG string to a Canvas
    let parser = new DOMParser();
    let svgDOM = parser.parseFromString(svgString as string, 'image/svg+xml').documentElement;

    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');

    let svgData = new XMLSerializer().serializeToString(svgDOM);

    let img = new Image();
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);

    img.onload = function() {
        let imgSize = {
            width: img.naturalWidth,
            height: img.naturalHeight,
        };

        let imgW = checkScaleMode(imgSize, 'width'),
            imgH = checkScaleMode(imgSize, 'height');

        canvas.width = imgW;
        canvas.height = imgH;

        ctx.drawImage(img, 0, 0, imgW, imgH);
        imageToArrayBuffer(canvas).then(bytes => {
            parent.postMessage({pluginMessage: {type: 'img', bytes}}, '*');
        });
    };
};

const App = ({}) => {
    const [inputVal, setInputVal] = React.useState(2);
    const [currentMode, setCurrentMode] = React.useState(0);

    // Generate MODE buttons
    const ModeSet = () => {
        // Class checking for the current mode
        const isActive = (mode, i, className) => {
            if (mode === i) {
                return className;
            } else {
                return null;
            }
        };

        // Set new value and current mode
        const handleBtnClick = (i, item) => {
            setCurrentMode(i);
            setInputVal(item.default);
        };

        return (
            <section className={styles.sizeMode}>
                {scaleModes.map((item, i) => {
                    return (
                        <div
                            key={item.name}
                            className={`${styles.sizeModeItem} ${isActive(currentMode, i, styles.sizeModeItemActive)}`}
                        >
                            <div
                                className={`${styles.sizeModeLabel} ${isActive(
                                    currentMode,
                                    i,
                                    styles.sizeModeLabelActive
                                )}`}
                            >
                                {item.name}
                            </div>
                            <button className={styles.sizeModeButton} onClick={() => handleBtnClick(i, item)}>
                                <Icon name={scaleModes[i].name} />
                            </button>
                        </div>
                    );
                })}
            </section>
        );
    };

    // Handle input value
    const handleInput = e => {
        const re = /^[0-9.\b]+$/; //rules
        if (e.target.value === '' || re.test(e.target.value)) {
            if (e.target.value > scaleModes[currentMode].max) {
                setInputVal(scaleModes[currentMode].max);
            } else if (e.target.value < scaleModes[currentMode].min) {
                setInputVal(scaleModes[currentMode].min);
            } else {
                setInputVal(e.target.value);
            }
        }
    };

    // Initial function that start the convertation process
    const handleSVGtoFigmaPaste = (target, type) => {
        parent.postMessage({pluginMessage: {type: 'clicked'}}, '*');

        onmessage = event => {
            if (event.data.pluginMessage.selected) {
                if (type === 'fromFile') {
                    let fileReader = new FileReader();
                    fileReader.readAsText(target.files[0]);
                    fileReader.onload = () => {
                        try {
                            prepareSVGforFigma(fileReader.result, scaleModes, currentMode, inputVal);
                        } catch (error) {
                            console.error(error, 'Something wrong with the file');
                        }
                    };
                    target.value = null;
                }
                if (type === 'fromClipboard') {
                    copyfromClipBoard().then(result => prepareSVGforFigma(result, scaleModes, currentMode, inputVal));
                }
            }
        };
    };

    return (
        <section className={styles.wrap}>
            <p className={styles.about}>
                Select what you want to fill, then select the input — file or clipboard. Change the resolution by scale
                — max 16, by width or height — max 10.000px.
            </p>
            <div className={styles.sizeInput}>
                <ModeSet />
                <span
                    id={'measureUnitSpan'}
                    style={{
                        left: `${
                            calculateSize(`${inputVal}xx`, {
                                font: 'Arial',
                                fontSize: '16px',
                                fontWeight: 'bold',
                            }).width
                        }px`,
                    }}
                    className={styles.measureUnitSpan}
                >
                    {scaleModes[currentMode].units}
                </span>
                <input value={inputVal} onChange={handleInput} maxLength={scaleModes[currentMode].length} />
            </div>
            <section className={styles.buttons}>
                <Button
                    fileType
                    text="SVG from file"
                    onChange={e => handleSVGtoFigmaPaste(e.target, 'fromFile')}
                    accept="image/svg+xml"
                />
                <Button
                    text="SVG from clipboard"
                    onClick={e => handleSVGtoFigmaPaste(e, 'fromClipboard')}
                    accept="image/svg+xml"
                    version
                />
            </section>
        </section>
    );
};

export default App;
