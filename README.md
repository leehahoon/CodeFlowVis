#### Visualize the code coverage and execution flow.

## Features

### Highlight Line
This feature highlights the content in a file based on the input provided. The file should be formatted as shown below:
```
[filename]:[line],[column]
```

An exmaple is as follows:
```
test1.c:10,2
test1.c:11,2
test2.c:13,4
...
```

You can execute `CodeFlowVis: Highlight Line` in command palette. 
When you execute the highting, you input the above file.

### Clear Highlighting
This feature removes the highlighted information.
You can execute `CodeFlowVis: Clear Highlight` in command palette. 

### Go To Highlight
You can use the `Go To Highlight` feature to navigate to the desired line in the code coverage file. The shortcut is (`cmd+alt+h`).

### Next, Previous Highlight
You can use the `Next Highlight` and `Previous Highlight` features to navigate to the next or previous step in the execution flow. The shortcuts are (`cmd+alt+n`) and (`cmd+alt+p`) respectively.

## Release Notes

### 0.0.1

Initial release of ...

### 0.0.2

Add `Go To Highlighting`, `Next Highlighting`, `Previous Highlighting` 

---


**Enjoy!**
