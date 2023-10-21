const map = {
  condition(operator, operands){
    return `${ operands[0] } ${ operator } ${ operands[1] }`
  },

  if(condition, trueBody, falseBody){
    return `if(${ map.condition(...condition) }){
      ${ trueBody.join("\n") }
    } else {
      ${ falseBody.join("\n") }
    }`
  },

  exit(){
    return "return;";
  },

  method(name, parameters){
    return `${ name }(${ parameters.join(", ") })`;
  }
};

function compile(code, arguments = []){
  return new Function(`const { ${ arguments.join(", ") } } = arguments[0] ?? {};
  ${ code }`);
}

function run(compiled){
  return compiled();
}

const code = map.if(
  ["===", [ "x", "y" ]],
  [
    map.method("console.log", [ "'equal'" ]),
  ],
  [
    map.if(
      ["===", [ 5, 5 ]],
      [
        map.method("console.log", [ "this", map.method("Math.max", [ 2, 3, 5 ]) ]),
        map.exit()
      ],
      [
        map.method("console.log", [
          map.method("Math.sqrt", [ 9 ])
        ])
      ]
    )
  ]
);

const compiledCode = compile(code, [ "x", "y", "z" ]);

console.log(run(compiledCode));