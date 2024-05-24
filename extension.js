// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
//const vscode = require('vscode');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
/*function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "codeflowvis" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('codeflowvis.helloWorld', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from CodeFlowVis!');
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
*/
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

function activate(context) {
	const yellowHighlightDecorationType = vscode.window.createTextEditorDecorationType({
		backgroundColor: '#fffb57',
		isWholeLine: true
	});

	let orderDecorationTypes = {};

	function getOrderDecorationType(order) {
		if (!orderDecorationTypes[order]) {
			const iconPath = path.join(__dirname, 'num_icons', `${order}.svg`);
			orderDecorationTypes[order] = vscode.window.createTextEditorDecorationType({
				gutterIconPath: iconPath,
				gutterIconSize: 'cover'
			});
		}
		return orderDecorationTypes[order];
	}

	async function applyHighlighting(highlightInfos) {
		vscode.window.visibleTextEditors.forEach(editor => {
			const decorationsArray = highlightInfos
				.filter(info => editor.document.uri.fsPath === info.filePath)
				.map(info => new vscode.Range(info.lineNumber, 0, info.lineNumber, editor.document.lineAt(info.lineNumber).text.length));

			editor.setDecorations(yellowHighlightDecorationType, decorationsArray);

			highlightInfos.forEach(info => {
				if (editor.document.uri.fsPath === info.filePath) {
					const range = new vscode.Range(info.lineNumber, 0, info.lineNumber, 0);
					const decorationType = getOrderDecorationType(info.order);
					editor.setDecorations(decorationType, [range]);
				}
			});
		});
	}

	function loadAndApplyHighlights() {
		const highlightInfos = context.globalState.get('highlightInfos', []);
		if (highlightInfos && highlightInfos.length > 0) {
			applyHighlighting(highlightInfos);
		}
	}

	// 이미 열려 있는 모든 텍스트 문서에 대해 하이라이트를 적용합니다.
	loadAndApplyHighlights();

	// 파일이 열릴 때마다 하이라이트를 적용합니다.
	context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(() => {
		loadAndApplyHighlights();
	}));

	// 활성 텍스트 에디터가 변경될 때 하이라이트를 적용합니다.
	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(() => {
		loadAndApplyHighlights();
	}));


	// 확장이 활성화될 때 이미 열린 문서에 대해 하이라이트를 적용
	loadAndApplyHighlights();

	// 파일에서 하이라이트 정보 읽기 및 적용
	async function applyHighlightFromFile(filePath) {
		const fileContent = fs.readFileSync(filePath, { encoding: 'utf8' });
		const lines = fileContent.split(/\r?\n/);

		// 현재 프로젝트의 루트 경로
		const projectRootPath = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : null;
		if (!projectRootPath) {
			vscode.window.showWarningMessage("No project is currently open.");
			return;
		}

		const highlightInfos = lines.map((line, index) => {
			const [relativeFilePath, lineStr] = line.split(':');
			const lineNumber = parseInt(lineStr, 10) - 1;
			return {
				filePath: path.join(projectRootPath, relativeFilePath),
				lineNumber,
				order: index + 1  // 순서 정보 추가
			};
		}).filter(info => !isNaN(info.lineNumber));

		// 하이라이트 정보 저장
		context.globalState.update('highlightInfos', highlightInfos);

		// 하이라이트 적용
		applyHighlighting(highlightInfos);
	}

	// VSCode 시작 시 저장된 하이라이트 정보 적용
	const storedHighlightInfos = context.globalState.get('highlightInfos', []);
	if (storedHighlightInfos.length > 0) {
		applyHighlighting(storedHighlightInfos);
	}

	// 사용자가 파일을 선택하여 하이라이트 적용하는 커맨드
	let highlightFromFileCommand = vscode.commands.registerCommand('codeflowvis.highlightLine', async function () {
		const filePath = await vscode.window.showOpenDialog({
			canSelectMany: false,
			openLabel: 'Select Highlight File',
			filters: { 'Text Files': ['*'] }
		});

		if (filePath && filePath[0]) {
			applyHighlightFromFile(filePath[0].fsPath);
		}
	});

	async function clearHighlighting() {
		// 모든 저장된 하이라이트 정보를 제거합니다.
		await context.globalState.update('highlightInfos', []);

		// 열려 있는 모든 텍스트 에디터에서 하이라이팅을 제거합니다.
		vscode.window.visibleTextEditors.forEach(editor => {
			editor.setDecorations(yellowHighlightDecorationType, []); // 빈 배열을 전달하여 하이라이팅 제거
		});
	}

	// 하이라이팅 비활성화 커맨드 등록
	let disableHighlightCommand = vscode.commands.registerCommand('codeflowvis.clearHighlight', function () {
		clearHighlighting();
		vscode.window.showInformationMessage('Highlighting disabled.');
	});

	context.subscriptions.push(disableHighlightCommand);
	context.subscriptions.push(highlightFromFileCommand);

	// 하이라이트된 라인으로 이동하는 커맨드
	let goToHighlightCommand = vscode.commands.registerCommand('codeflowvis.goToHighlight', async function () {
		const highlightInfos = context.globalState.get('highlightInfos', []);
		if (highlightInfos.length === 0) {
			vscode.window.showInformationMessage('No highlights found.');
			return;
		}

		const orderItems = highlightInfos.map(info => ({
			label: `ExecFlow ${info.order}: ${path.basename(info.filePath)}:${info.lineNumber + 1}`,
			info
		}));

		const selectedOrder = await vscode.window.showQuickPick(orderItems, {
			placeHolder: 'Select a highlight to go to'
		});

		if (selectedOrder) {
			const { filePath, lineNumber } = selectedOrder.info;
			const document = await vscode.workspace.openTextDocument(filePath);
			const editor = await vscode.window.showTextDocument(document);
			const range = new vscode.Range(lineNumber, 0, lineNumber, 0);
			editor.selection = new vscode.Selection(range.start, range.end);
			editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
		}
	});

	context.subscriptions.push(goToHighlightCommand);

	// 다음 하이라이트로 이동하는 커맨드
	let nextHighlightCommand = vscode.commands.registerCommand('codeflowvis.nextHighlight', function () {
		const highlightInfos = context.globalState.get('highlightInfos', []);
		if (highlightInfos.length === 0) {
			vscode.window.showInformationMessage('No highlights found.');
			return;
		}

		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showInformationMessage('No active editor found.');
			return;
		}

		const currentFilePath = editor.document.uri.fsPath;
		const currentPosition = editor.selection.active;
		const currentHighlightIndex = highlightInfos.findIndex(info =>
			info.filePath === currentFilePath &&
			info.lineNumber === currentPosition.line
		);

		if (currentHighlightIndex === -1 || currentHighlightIndex === highlightInfos.length - 1) {
			vscode.window.showInformationMessage('No next highlight found.');
			return;
		}

		const nextHighlight = highlightInfos[currentHighlightIndex + 1];
		const document = vscode.workspace.openTextDocument(nextHighlight.filePath).then(doc => {
			vscode.window.showTextDocument(doc).then(editor => {
				const range = new vscode.Range(nextHighlight.lineNumber, 0, nextHighlight.lineNumber, 0);
				editor.selection = new vscode.Selection(range.start, range.end);
				editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
			});
		});
	});

	context.subscriptions.push(nextHighlightCommand);

	// 이전 하이라이트로 이동하는 커맨드
	let previousHighlightCommand = vscode.commands.registerCommand('codeflowvis.previousHighlight', function () {
		const highlightInfos = context.globalState.get('highlightInfos', []);
		if (highlightInfos.length === 0) {
			vscode.window.showInformationMessage('No highlights found.');
			return;
		}

		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showInformationMessage('No active editor found.');
			return;
		}

		const currentFilePath = editor.document.uri.fsPath;
		const currentPosition = editor.selection.active;
		const currentHighlightIndex = highlightInfos.findIndex(info =>
			info.filePath === currentFilePath &&
			info.lineNumber === currentPosition.line
		);

		if (currentHighlightIndex === -1 || currentHighlightIndex === 0) {
			vscode.window.showInformationMessage('No previous highlight found.');
			return;
		}

		const previousHighlight = highlightInfos[currentHighlightIndex - 1];
		const document = vscode.workspace.openTextDocument(previousHighlight.filePath).then(doc => {
			vscode.window.showTextDocument(doc).then(editor => {
				const range = new vscode.Range(previousHighlight.lineNumber, 0, previousHighlight.lineNumber, 0);
				editor.selection = new vscode.Selection(range.start, range.end);
				editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
			});
		});
	});

	context.subscriptions.push(previousHighlightCommand);
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
};
