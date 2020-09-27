// Show UI
figma.showUI(__html__, {width: 240, height: 300});

figma.ui.onmessage = msg => {
    if (msg.type === 'img') {
        // console.log(msg);
        if (figma.currentPage.selection[0]) {
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
        } else {
            figma.notify('📌 Select something…', {
                timeout: 2000,
            });
        }
    }
};

figma.currentPage.setRelaunchData({open: ''});
