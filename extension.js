const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { AudioContext } = require('node-web-audio-api');

let soundEnabled = true;
let soundPack = 'cream'; // Paquete de sonidos por defecto
const audioContext = new AudioContext();

/**
 * Reproduce un sonido.
 * @param {string} filePath - Ruta del archivo de sonido
 */
async function playSound(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            console.error(`❌ Archivo no encontrado: ${filePath}`);
            return;
        }
        const buffer = fs.readFileSync(filePath);
        const audioBuffer = await audioContext.decodeAudioData(buffer.buffer);
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();
    } catch (error) {
        vscode.window.showErrorMessage(`❌ Error al reproducir sonido: ${error.message}`);
    }
}

/** Devuelve un sonido aleatorio de GENERIC_R0 a GENERIC_R4 **/
function getRandomGenericSound() {
    const index = Math.floor(Math.random() * 5); // 0-4
    return getSoundPath(`press/GENERIC_R${index}.mp3`);
}

/** Devuelve la ruta de un sonido basado en el tipo **/
function getSoundPath(fileName) {
    return path.join(__dirname, 'assets/audio', soundPack, fileName);
}

/** Activa la extensión y registra eventos **/
function activate(context) {
    console.log('🔊 Extensión activada');
    console.log(`📦 Paquete de sonidos cargado: ${soundPack}`);

    let enableCommand = vscode.commands.registerCommand('keyboard-sounds.enable', () => {
        soundEnabled = true;
        vscode.window.showInformationMessage('🔊 Sonidos del teclado activados.');
    });

    let disableCommand = vscode.commands.registerCommand('keyboard-sounds.disable', () => {
        soundEnabled = false;
        vscode.window.showInformationMessage('🔇 Sonidos del teclado desactivados.');
    });

    let changePackCommand = vscode.commands.registerCommand('keyboard-sounds.changePack', async () => {
        const options = ['alpaca', 'blackink', 'bluealps', 'boxnavy', 'buckling', 'cream', 'holypanda', 'mxblack', 'mxblue', 'mxbrown', 'redink', 'topre', 'turquoise'];
        const selection = await vscode.window.showQuickPick(options, {
            placeHolder: 'Selecciona el paquete de sonidos'
        });
        if (selection) {
            soundPack = selection;
            vscode.window.showInformationMessage(`📦 Paquete de sonidos cambiado a ${soundPack}.`);
        }
    });

    context.subscriptions.push(enableCommand, disableCommand, changePackCommand);

    // Teclas presionadas
    vscode.workspace.onDidChangeTextDocument(event => {
        if (!soundEnabled) return;
        const changes = event.contentChanges;
        if (changes.length === 0) return;
        const text = changes[0].text;

        // Verifica que no este vacío el texto
        if (text.trim() !== "") {
            if (/^[a-zA-Z]$/.test(text)) { // Letras
                playSound(getRandomGenericSound());
            } else if (text === ' ') { // Espacio
                playSound(getSoundPath('press/SPACE.mp3'));
            } else if (text === '\n') { // Enter
                playSound(getSoundPath('press/ENTER.mp3'));
            } else if (text === '') { // Backspace (cuando se borra texto)
                playSound(getSoundPath('press/BACKSPACE.mp3'));
            }
        }
    });

    // Teclas soltadas
    vscode.window.onDidChangeTextEditorSelection(() => {
        if (!soundEnabled) return;

        // Aquí no podemos capturar la tecla exacta, pero podemos reproducir sonidos al soltar
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        const cursorPos = editor.selection.active;

        if (cursorPos.character === 0) { // Backspace
            playSound(getSoundPath('release/BACKSPACE.mp3'));
        } else {
            playSound(getSoundPath('release/GENERIC.mp3')); // Sonido genérico al soltar teclas
        }
    });
}

/** Desactiva la extensión **/
function deactivate() {
    console.log('🔇 Extensión desactivada');
    vscode.window.showInformationMessage('🔇 Sonidos del teclado desactivados.');

    if (audioContext) {
        audioContext.close().then(() => {
            console.log('🎵 AudioContext cerrado correctamente.');
        }).catch(error => {
            console.error('❌ Error al cerrar AudioContext:', error);
        });
    }
}

module.exports = { activate, deactivate };
