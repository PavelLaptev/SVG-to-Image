// Show UI
figma.showUI(__html__, {width: 240, height: 268});

figma.ui.onmessage = msg => {
    // If clicked msg and something selected we send message back to the UI to execute parse function
    if (msg.type === 'clicked') {
        if (figma.currentPage.selection[0]) {
            figma.ui.postMessage({type: 'selection', selected: figma.currentPage.selection[0]});
        } else {
            figma.notify('📌 Select something to fill…', {
                timeout: 2000,
            });
        }
    }

    // Create img and fill
    if (msg.type === 'img') {
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
};

figma.currentPage.setRelaunchData({open: ''});
