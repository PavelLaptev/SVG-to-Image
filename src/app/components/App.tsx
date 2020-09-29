import * as React from 'react';
import styles from './app.module.scss';
import {Button, Icon} from './elements';
import calculateSize from 'calculate-size';

function calculateAspectRatioFit(srcWidth, srcHeight, maxSize) {
    var ratio = Math.min(maxSize / srcWidth, maxSize / srcHeight);
    return {width: srcWidth * ratio, height: srcHeight * ratio};
}

function canvasToArrayBuffer(canvas: HTMLCanvasElement): Promise<ArrayBuffer> {
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
}

const converToImage = (svgString, modes, currentMode, val) => {
    const checkScaleMode = (size, dimension) => {
        if (modes[currentMode].name === modes[0].name) {
            console.log(size[dimension] * val);
            return size[dimension] * val;
        } else {
            // console.log(size * val);
            return calculateAspectRatioFit(size.width, size.height, val)[dimension];
        }
    };

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
        canvasToArrayBuffer(canvas).then(bytes => {
            // console.log(bytes);
            parent.postMessage({pluginMessage: {type: 'img', bytes}}, '*');
        });
    };
};

const App = ({}) => {
    const [inputVal, setInputVal] = React.useState(2);
    const [currentMode, setCurrentMode] = React.useState(0);

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

    const getSize = string => {
        return calculateSize(string, {
            font: 'Arial',
            fontSize: '16px',
            fontWeight: 'bold',
        });
    };

    const ModeSet = () => {
        const isActive = (mode, i, className) => {
            if (mode === i) {
                return className;
            } else {
                return null;
            }
        };

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

    const handleLoadSVG = e => {
        let fileReader = new FileReader();
        fileReader.readAsText(e.target.files[0]);
        fileReader.onload = () => {
            try {
                converToImage(fileReader.result, scaleModes, currentMode, inputVal);
            } catch (error) {
                console.error(error, 'Something wrong with the file');
            }
        };
        e.target.value = null;
    };

    const handleClipboardSVG = () => {
        const textField = document.createElement('textarea');
        textField.style.opacity = '0';
        document.body.appendChild(textField);
        textField.focus();
        document.execCommand('paste');
        console.log(textField.value);
        textField.remove();

        // var pasteText = document.querySelector("#output");
        // pasteText.focus();
        // document.execCommand("paste");
        // console.log(pasteText.textContent);
        // let fileReader = new FileReader();
        // fileReader.readAsText(e.target.files[0]);
        // fileReader.onload = () => {
        //     try {
        //         converToImage(fileReader.result, scaleModes, currentMode, inputVal);
        //     } catch (error) {
        //         console.error(error, 'Something wrong with the file');
        //     }
        // };
    };

    return (
        <section className={styles.wrap}>
            <p className={styles.about}>
                Select the element you want to fill, then select the input — from file or clipboard. Change the
                resolution by scale — max 10, by width or height — max 10.000px.
            </p>
            <div className={styles.sizeInput}>
                <ModeSet />
                <span
                    id={'measureUnitSpan'}
                    style={{left: `${getSize(`${inputVal}xx`).width}px`}}
                    className={styles.measureUnitSpan}
                >
                    {scaleModes[currentMode].units}
                </span>
                <input
                    value={inputVal}
                    onChange={handleInput}
                    maxLength={scaleModes[currentMode].length}
                    // max={scaleModes[currentMode].max}
                    // min={scaleModes[currentMode].min}
                />
            </div>
            <section className={styles.buttons}>
                <Button fileType text="SVG from file" onChange={handleLoadSVG} accept="image/svg+xml" />
                <Button text="SVG from clipboard" onClick={handleClipboardSVG} accept="image/svg+xml" />
            </section>
        </section>
    );
};

export default App;
