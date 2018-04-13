const fs = require('fs');
const readline = require('readline');

let tableOutputFile = "table.txt";
let treeOutputFile = "tree.txt";
let scopeId = 0;
const newScope = (parent) => {
	return {
		id: scopeId++,
		parent: parent,
		vtable: [],
		ftable: []

	};
}
const processTree = (rootNode) => {
    /*
        perform your algorithm here. 
        use writeLine(<outputFile>, <line>) to generate the output file when you're done.

        each node has the following properties:
        node.index          > Index specified in inputfile [integer]
        node.type           > Type specified in inputfile [string]
        node.data           > Data specified in inputfile [string]
        node.childNodes     > Array of child nodes, in order specified in inputfile [arr<node>]
    */
    let rootScope = newScope(null);
    parseNode(rootNode, rootScope);

}
const lookupVar = (name, scope) => {
	while(scope != null)
	{
		if(scope.vtable[name] !== undefined)
			return [scope.vtable[name].index, scope.vtable[name].name];
		scope = scope.parent;
	}
	return null;
}
const lookupFunc = (name, scope) => {
	while(scope != null)
	{
		if(scope.ftable[name] !== undefined)
			return [scope.ftable[name].index, scope.ftable[name].name];
		scope = scope.parent;
	}
	return null;
}
let currentVar = 0;
let currentProc = 0;
let table = [];
let tableId = 0;
const parseNode = (node, currentScope) => {
	let tableEntry = { id: tableId, scope: currentScope.id };
	table[tableId] = tableEntry; 
	node.tableEntry = tableId;
	console.log("Parsing", node.index, node.type, node.data, "with table entry", tableId, currentScope.id);
	if(node.type == "DECL")
	{
		let name = "V" + currentVar++;
		let type = node.childNodes[0].data;
		currentScope.vtable[node.childNodes[1].data] = { 
			index: tableId,
			name: name,
			type: type 
		};
		tableEntry.name = name;
		tableEntry.type = type;
	}
	else if(node.type == "VAR")
	{
		let index = lookupVar(node.data, currentScope);
		let name = "";
		if(index == null) name = "U";
		else name = index[1];
		tableEntry.decl = index[0];
		tableEntry.name = name;
	}
	else if(node.type == "NAME")
	{
		let index = lookupFunc(node.data, currentScope);
		let name = "";
		if(index == null) name = "U";
		else name = index[1];
		tableEntry.decl = index[0];
		tableEntry.name = name;
	}
	else if(node.type == "PROC")
	{
		let name = "P" + currentProc++;
		currentScope.ftable[node.data] = {
			index: tableId,
			name: name
		};
		tableEntry.name = name;
		currentScope = newScope(currentScope);
	}
	//special case, as both children have different scopes (then body and else body)
	else if(node.type == "COND_BRANCH")
	{
		currentScope = newScope(currentScope);
		parseNode(node.childNodes[0], currentScope); //the condition of the if statement shares the same scope
		let ifScope = newScope(currentScope); //scope for the then body
		parseNode(node.childNodes[1], ifScope); //parse then body
		if(node.childNodes.length >= 3) //if statement doesn't necessarily have an else
		{
			let elseScope = newScope(currentScope); //scope for the else body
			parseNode(node.childNodes[2], elseScope); //parse else body
		}
	}
	else if(node.type == "CONDLOOP")
	{
		currentScope = newScope(currentScope);
		let childNode = node.childNodes[0];
		let name = "V" + currentVar++;
		currentScope.vtable[childNode.data] = {
			index: tableId + 1,
			name: name 
		};
	}

	console.log("Final table entry", tableEntry);
	writeLine(tableOutputFile, JSON.stringify(tableEntry));
	let line = node.index + "|" + tableId + "|" + node.type + "|" + node.data;
	for(var i = 0; i < node.childNodes.length; i++)
	{
		line += "|" + node.childNodes[i].index;
	}
	writeLine(treeOutputFile, line);
	tableId++;

	for(var i = 0; i < node.childNodes.length; i++)
	{
		if(node.type != "COND_BRANCH") //COND_BRANCH will have already manually had its children parsed.
			//I know, bad practice, but idc at this point...
			parseNode(node.childNodes[i], currentScope);
	}
}


const writeLine = (outputFile, line) => {
    fs.appendFileSync(outputFile, line + '\r\n');
}

const main = (argc, argv) => {
    if (argc < 2) {
        console.error("Invalid call to", argv[0],"made. Correct format:");
        console.error("node", argv[0], "<filename>");
        process.exit();
	}
	else {
        const fileStream = fs.createReadStream(argv[1], {
            fd: null,
            encoding: 'utf8'
        });

        const lineReader = readline.createInterface({
            input: fileStream
        });

        const treeData = [];

        lineReader.on('line', (line) => {
            const lineData = {};
            const lineValues = line.split('|');
            lineData.index = parseInt(lineValues.shift());
            lineData.type = lineValues.shift();
            lineData.data = lineValues.shift();
            lineData.childNodes = lineValues.map(childIndex => parseInt(childIndex));
            treeData.push(lineData);
        });

        lineReader.on('close', (line) => {
            treeData.map((lineData, index) => {
                lineData.childNodes = lineData.childNodes.map((cIndex) => treeData[treeData.findIndex(line => line.index === cIndex)]);
                return lineData;
            })

            processTree(treeData[0]);
            process.exit();
        });

        fileStream.on('error', (error) => {
            console.error("Error reading from file:",error);
        });
    }
};

main(process.argv.length - 1, process.argv.slice(1));
