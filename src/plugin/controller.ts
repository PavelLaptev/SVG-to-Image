// Show UI
figma.showUI(__html__, {width: 240, height: 268});

figma.ui.onmessage = msg => {
    if (msg.type === 'img') {
        // console.log(msg);
        const target = figma.currentPage.selection[0];
        const currentFills = target['fills'];
        const imageHash = figma.createImage(msg.bytes).hash;

        const newFill = {
            type: 'IMAGE',
            opacity: 1,
            blendMode: 'NORMAL',
            scaleMode: 'FILL',
            imageHash: imageHash,
        };

        target['fills'] = [...currentFills, ...[newFill]];
    }

    if (msg.type === 'clicked') {
        figma.ui.postMessage({type: 'selection', selected: figma.currentPage.selection[0]});
    }

    if (msg.type === 'nullSelection') {
        figma.notify('📌 Select something to fill…', {
            timeout: 2000,
        });
    }
};

figma.currentPage.setRelaunchData({open: ''});
