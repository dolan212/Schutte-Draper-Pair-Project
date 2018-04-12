const fs = require('fs');
const readline = require('readline');

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

    //example: simple bfs over tree that prints each node's type to 'exampleOutput.txt'
    let nodes = [rootNode];
    let counter = 0;

    while (counter < nodes.length) {
        nodes = nodes.concat(nodes[counter].childNodes);

        writeLine("exampleOutput.txt", nodes[counter].type);
        ++counter;
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