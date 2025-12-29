const vscode = require('vscode');

function activate(context) {
    console.log('Refactorly is active!');

    let disposable = vscode.commands.registerCommand('refactorly.fixCode', async function () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const selection = editor.selection;
        const text = editor.document.getText(selection);

        if (!text) {
            vscode.window.showErrorMessage('Refactorly: No code selected!');
            return;
        }

        // Show a progress indicator
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Refactorly: Analyzing Code...",
            cancellable: false
        }, async (progress) => {
            try {
                // 1. Send to your Local Backend
                const response = await fetch('http://localhost:8000/refactor', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        code: text,
                        use_personalization: true, // Defaults to RAG on
                        user_id: "vscode-user",    // Simple ID for demo
                        custom_style: ""           // Or hardcode a style here if you want
                    })
                });

                const data = await response.json();

                if (data.refactored_code) {
                    // 2. Replace the text in the editor
                    editor.edit(editBuilder => {
                        editBuilder.replace(selection, data.refactored_code);
                    });
                    vscode.window.showInformationMessage('Refactorly: Done! ✨');
                } else {
                    vscode.window.showErrorMessage('Refactorly: Failed to generate code.');
                }

            } catch (error) {
                console.error(error);
                vscode.window.showErrorMessage('Error connecting to Refactorly Backend. Is it running?');
            }
        });
    });

    context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};