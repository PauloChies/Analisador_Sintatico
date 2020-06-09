//entradas
$(document).ready(function () {

    $('#input-sentence').on('keyup', function() {
        resetApp();
        tableUpdate();
    });

    $('#btn-clean').click(function() {
        $('#input-sentence').val('').focus();
        resetApp();
        tableUpdate();
    });

    $('#btn-verify-sentence').click(function() {
        var inputSentence = oneStepAnalysis($('#input-sentence').val());
        tableUpdate(inputSentence);
    });

    $('#btn-verify-step').click(function() {
        var inputSentence = stepByStepAnalysis($('#input-sentence').val());
        tableUpdate(inputSentence);
    });

    $('#btn-generate').click(function() {
        $('#btn-clean').click();
        var sentence = randomSentence();
        $('#input-sentence').val(sentence);
    });
});

var input = [];
var stack = ['$', 'S'];
var mountTable = [];
var keepAnalysing = true;
var accepted = null;
var iteration = 1;

const TERMINALS = ['a', 'b', 'c', 'd', 'e'];
const NON_TERMINALS = ['S', 'A', 'B', 'C'];

var grammar = {
    'S': ['bB', 'eA'],
    'A': ['cB', 'bSA'],
    'B': ['eC', '&'],
    'C': ['dB', 'bS']
};

var parsingTable = {
    'S': {
        'b': ['b', 'B'],
        'e': ['e', 'A']
    },
    'A': {
        'b': ['b', 'S', 'A'],
        'c': ['c', 'B']
    },
    'B': {
        'b': ['&'],
        'c': ['&'],
        '$': ['&'],
        'e': ['e', 'C']
    },
    'C': {
        'b': ['b', 'S'],
        'd': ['d', 'B']
    }
};

function resetApp() {
    stack = ['$', 'S'];
    input = [];
    keepAnalysing = true;
    accepted = null;
    mountTable = [];
    iteration = 1;
}

function currentState() {
    return {
        input: input.join(''),
        stack: stack.join(''),
        accepted: accepted,
        table: mountTable
    };
}

function randomSentence() {
    var rule = 'S';
    var generating = true;
    var sentence = '';
    while (generating) {
        var ruleLength = grammar[rule].length;
        var generatedSentence = grammar[rule][Math.floor(Math.random() * ruleLength)];

        sentence === '' ? sentence = generatedSentence : sentence = sentence.replace(rule, generatedSentence);

        var ruleIndex = -1;
        for (var i = 0; i < sentence.length; i++) {
            ruleIndex = NON_TERMINALS.indexOf(sentence[i]);
            if (ruleIndex !== -1) {
                rule = NON_TERMINALS[ruleIndex];
                break;
            }
        }
        if (ruleIndex === -1) {
            generating = false;
        } 
    }
    sentence = sentence.replace(/[^a-zA-Z0-9]/g,'');
    return sentence;
}

function newStepAnalysis() {

    // cria a linha da tabela de derivação
    var tableRow = {
        iter: iteration,
        stack: stack.join(''),
        input: input.join('')
    };

    // topo da pilha
    var topStack = stack[stack.length - 1];

    // simbolo atual na entrada
    var currentSymbol = input[0];

    // se o final da pilha e símbolo atual = $ então sentença aceita
    if (topStack === '$' && currentSymbol === '$') {
        keepAnalysing = false;
        accepted = true;
        tableRow.action = 'Aceito em ' + iteration + ' iterações';
    } else {
        // se o topo da pilha for igual ao simbolo da entrada, lê a entrada
        if (topStack === currentSymbol) {
            tableRow.action = 'Lê \'' + currentSymbol + '\'';
            stack.pop();
            input.shift();

            // se existir uma entrada equivalente ao simbolo de entrada ao 
            // não-terminal no topo da pilha na tabela de Parsing
        } else if (
            parsingTable[topStack] !== undefined &&
            parsingTable[topStack][currentSymbol] !== undefined
        ) {
            // produção em array da tabela de parsing para o simbolo terminal da entrada
            var toStack = parsingTable[topStack][currentSymbol];
            // produção em formato de string
            var production = toStack.join('');

            // adiciona a ação atual na tabela
            tableRow.action = topStack + ' -> ' + production;

            // remove o topo da pilha
            stack.pop();

            // se a produção não for vazia ('&'), coloca seu conteúdo da pilha
            if (production !== '&') {
                for (var j = toStack.length - 1; j >= 0; j--) {
                    stack.push(toStack[j])
                }
            }

            // finaliza a analise com erro
        } else {
            keepAnalysing = false;
            accepted = false;
            tableRow.action = 'Erro em ' + iteration + ' iterações';
        }
    }

    // incrementa a iteração e coloca a linha gerada na tabela
    iteration++;
    mountTable.push(tableRow);
}

function oneStepAnalysis(inputString) {
    
    resetApp();

    input = (inputString + '$').split('');

    while (keepAnalysing) {
        newStepAnalysis();
    }

    return currentState();
}

var savedInput = '';

function stepByStepAnalysis(inputString) {
    if (inputString !== savedInput || !keepAnalysing) {
        resetApp();
        savedInput = inputString;
        input = (inputString + '$').split('');
    }

    newStepAnalysis();

    return currentState();
}

function mountCurrentTable(table) {
    if (table === undefined) {
        table = mountTable;
    }

    $htmlTable = $('.debug-table > tbody');
    $htmlTable.html('');

    for (var i = 0; i < table.length; i++) {
        $row = $('<tr>');
        $row.append('<td>' + table[i].stack + '</td>');
        $row.append('<td>' + table[i].input + '</td>');
        $row.append('<td>' + table[i].action + '</td>');
        $htmlTable.append($row);
    }
}

function acceptanceFeedback(accepted) {
    $('#input-sentence').removeClass('is-invalid is-valid');
    if (accepted === true) {
        $('#input-sentence').addClass('is-valid');
    } else if (accepted === false) {
        $('#input-sentence').addClass('is-invalid');
    }
}

function tableUpdate(inputSentence) {
    if (inputSentence === undefined) {
        acceptanceFeedback(null);
        mountCurrentTable([]);
    } else {
        acceptanceFeedback(inputSentence.accepted);
        mountCurrentTable(inputSentence.table);
    }
}