/**
 * Does your code check out, stack wise?
 * This simple script runs through your code,
 * pushing and popping paired operators.
 *
 * - Mike "Pomax" Kamermans
 */

var debug = false;

function log(s) {
  if(debug) window.console.log(s);
}

function checkStack(text)
{
    // step zero: remove any [\d+] line markers
    var lns = text.split("\n"), i, last = lns.length;
    for(i=0; i<last; i++) { lns[i] = lns[i].replace(/^\[\d+\]\s/,""); }
    text = lns.join("\n");

    // step one: strip comments. This is more work
    // than you may think, thanks to quoted strings.
    text = stripComments(text);

    // opening characters for pairs
    var openers = ["'",'"','{','[','('];

    // closing characters for pairs
    var closers = ["'",'"','}',']',')'];

    // if we find a ' or ", we have to basically ignore everything
    // until we find the closing character, because it's not code.
    var exclusives = ["'",'"'];

    // we're going to run through this text
    // as Unicode. That's a problem for browsers
    // that still implement Strings as sequences
    // of bytes. Because bytes ruin everything.
    var len = text.length,
        c,
        chr,
        top,
        op,              // used for 'corresponding opener'
        cl,              // used for 'corresponding closer'
        exclusively=-1,  // there are some pairs that force us to ignore other characters
        stack = [],      // our pair stack (we'll only store openers)
        lines = [],      // our line-number-for-opening-operator
        line=1,
        error=[];

    // let's go!
    for(c=0; c<len; c++)
    {
        chr = text[c]; // JavaScript allows string-as-array access

        // If we see an opening character, we chronicle this.
        op = openers.indexOf(chr);
        if(op!==-1 && exclusively===-1) {
            log("[op] "+chr+", stack: ["+stack+"]");
            push(stack,chr);
            lines.push(line);

            // check whether we need to go into 'exclusive' mode
            exclusively = startExclusive(stack, exclusives, chr);

            // This iteration is done. Don't waste cycles:
            // move on to the next iteration instead.
            continue;
        }

        // If we see a closing character, is it the right one?
        cl = closers.indexOf(chr);
        if(cl!==-1) {
            log("[cl] "+chr+", stack: ["+stack+"]");
            top = peek(stack);
            if(top === undefined) {
                error.push("ERROR: saw a "+chr+" on line "+line+" that has no corresponding opening anywhere.");
                stack.push("dummyvalue");
                break;
            }
            // if we're in exclusive mode, is this the correct terminator?
            if(exclusively!==-1) {
                if(chr===exclusives[exclusively] && top===chr) {
                    exclusively = -1;
                    pop(stack);
                    pop(lines);
                } else {
                    continue;
                }
            } else {
                // normal resolution
                op = openers[cl];
                if(top===op) {
                    pop(stack);
                    pop(lines);
                } else {
                    window.console.log(lines);
                    window.console.log(stack);
                    var position = lines[stack.length-1];
                    error.push("ERROR: expected to close pair for "+top+", opened on line "+position+", found "+chr+" instead, on line "+line);
                    break;
                }
            }
        }
        if(chr==="\n") { line++; }
    }

    if(error.length===0) {
        if(stack.length===0) {
            error.push("This code looks pretty good, stack wise.");
        } else {
            var stl = stack.length;
            error.push("ERROR: stack still contains "+(stl===1 ? "an" : stl)+" unclosed pair"+(stl===1?'':'s') + " (unclosed pairs have their opening at: "+lines.join(',')+")");
        }
    }

    var stack_color = (stack.length>0 ? "#600" : "#090"),
        textArea = document.querySelector('#checkit');
    textArea.style.backgroundColor = stack_color;
    textArea.title = error.join("\n");

    // add line numbers if the code is bad
    if(stack_color === "#600") {
      for(i=0, last=lns.length; i<last; i++) {
        lns[i] = "["+(i+1)+"] " + lns[i]; }}
    textArea.value = lns.join("\n");
}

function space(array) {
    return new Array(array.length).join(" ");
}

function push(array, element) {
    log(space(array) +  " pushing "+element);
    array.push(element);
}

function pop(array) {
    var pop = array.pop();
    log(space(array) +  " popped "+pop);
    return pop;
}

function peek(array) {
    var peek = array[array.length-1];
    log(space(array) +  "peeked at "+peek);
    return peek;
}

function startExclusive(array, exclusives, chr) {
    var exclusive = exclusives.indexOf(chr);
    if(exclusive!==-1) { log(space(array) + "going into exclusive mode for "+chr); }
    return exclusive;
}

/**
 * Helper function - strip comments from a string.
 */
function stripComments(data) {
    var i, e, chr,
        inquote1 = false,
        inquote2 = false,
        incomment = false,
        rewritten = "";

    // strip single-line comments
    data = data.split("\n");
    for (i = 0, e = data.length; i < e; i++) {
        data[i] = data[i].replace(/\/\/.*$/,'');
    }
    data = data.join("\n");

    // strip multi-line comments
    for (i = 0, e = data.length; i < e; i++) {
        chr = data[i];
        if (!incomment) {
            if (!inquote1 && !inquote2 && chr === "'") {
                inquote1 = true;
            } else if (!inquote1 && !inquote2 && chr === '"') {
                inquote2 = true;
            } else if (inquote1 && chr === "'") {
                inquote1 = false;
            } else if (inquote2 && chr === '"') {
                inquote2 = false;
            }
        }

        if (!inquote1 && !inquote2 && !incomment && chr === "/" && i + 1 < e && data[i + 1] === "*") {
            incomment = true;
        } else if (!inquote1 && !inquote2 && incomment && chr === "*" && i + 1 < e && data[i + 1] === "/") {
            incomment = false;
            i += 1; // we need to skip the "/" in the "*/" pair
            continue;
        }

        if (!incomment) {
            rewritten += chr;
        }
    }

    return rewritten;
};
