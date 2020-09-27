import * as React from 'react';
import styles from './app.module.scss';
import {Button, Icon} from './elements';

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

const converToImage = svgString => {
    let parser = new DOMParser();
    let svgDOM = parser.parseFromString(svgString as string, 'image/svg+xml').documentElement;

    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');

    let svgData = new XMLSerializer().serializeToString(svgDOM);

    let img = new Image();
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);

    img.onload = function() {
        let imgW = img.naturalWidth,
            imgH = img.naturalHeight;

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

    const handleLoadSVG = e => {
        let fileReader = new FileReader();
        fileReader.readAsText(e.target.files[0]);
        fileReader.onload = () => {
            try {
                converToImage(fileReader.result);
            } catch (error) {
                console.error(error, 'Something wrong with the file');
            }
        };
        e.target.value = null;
    };

    const handleInput = e => {
        setInputVal(e.target.value);
    };

    const ModeSet = () => {
        const modes = [
            {
                name: 'scale',
                max: 20,
            },
            {
                name: 'width',
                max: 10000,
            },
            {
                name: 'height',
                max: 10000,
            },
        ];

        return (
            <section className={styles.sizeMode}>
                {modes.map((item, i) => {
                    return (
                        <button
                            key={item.name}
                            className={`${styles.sizeModeButton} ${
                                currentMode === i ? styles.sizeModeButtonActive : null
                            }`}
                        >
                            <Icon name={modes[i].name} />
                        </button>
                    );
                })}
            </section>
        );
    };

    return (
        <section className={styles.wrap}>
            <p className={styles.about}>
                Select the element you want to fill the SVG, then select the input - from file or clipboard. You can
                also choose the resolution for the bitmap.
            </p>
            <div className={styles.sizeInput}>
                <ModeSet />
                <input type="number" value={inputVal} onChange={handleInput} />
            </div>
            <section className={styles.buttons}>
                <Button fileType text="Fill from file" onChange={handleLoadSVG} accept="image/svg+xml" />
                <Button text="Fill from clipboard" onChange={e => console.log(e)} accept="image/svg+xml" />
            </section>
        </section>
    );
};

export default App;
