import * as React from 'react';
// import {decode} from '../utils';
import '../styles/ui.scss';
import {Button} from './elements';

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
const converToImage = svg => {
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    let svgData = new XMLSerializer().serializeToString(svg);

    let img = new Image();
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);

    img.onload = function() {
        let imgW = img.naturalWidth,
            imgH = img.naturalHeight;

        // var ratio = canvasW / imgW;
        canvas.width = imgW;
        canvas.height = imgH;

        console.log(imgW, imgH);
        // console.log(img.src);

        ctx.drawImage(img, 0, 0, imgW, imgH);
        canvasToArrayBuffer(canvas).then(bytes => {
            // console.log(bytes);
            parent.postMessage({pluginMessage: {type: 'img', bytes}}, '*');
        });
    };
};

const App = ({}) => {
    const handleLoadSVG = e => {
        let fileReader = new FileReader();
        fileReader.readAsText(e.target.files[0]);

        fileReader.onload = () => {
            try {
                let parser = new DOMParser();
                const DOMSvg = parser.parseFromString(fileReader.result as string, 'image/svg+xml').documentElement;

                // console.log(DOMSvg);
                converToImage(DOMSvg);
                // console.log(base64Img);
                // convertDataURIToBinary(base64Img).then(bytes => {
                //     console.log(bytes);
                //     parent.postMessage({pluginMessage: {type: 'img', bytes}}, '*');
                // });
                // const bytes = convertDataURIToBinary(base64Img);
                // parent.postMessage({pluginMessage: {type: 'img', bytes}}, '*');
            } catch (error) {
                console.error(error, 'Something wrong with the file. Check the structure');
            }
        };
        e.target.value = null;
    };

    return (
        <div>
            Hddd
            <Button fileType text="hello" onChange={handleLoadSVG} accept="image/svg+xml" />
        </div>
    );
};

export default App;
