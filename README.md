# trickle

A simple framework to write flow based operations

```javascript
let envArgs = {
  outputTemplate: 'The result is %d'
};

let trickle = new Trickle(envArgs, {});

trickle
  .new((x) => x * x, [4])  // square
  .transform((x) => x / 2) // divide by 2
  .store((x) => ({ output: x }))  // store x as output in the trickle context
  .continue((x) => console.log('Half of 16 is', x))  // peek into the pipeline and log the value of x
  .new(
    (format, value) => console.log(format, value),
    ["{{outputTemplate}}", "<<output>>"]
  ) // use the variables from environment and context 
  .done() // execute the flow
```

### Functionality 

The basic functions defined as follows:

#### .new

A new operation that does not consider the response of the previous operation.

The flows environment variables can be accessed by providing the arguments in the format `{{environmentVariableKey}}`.

The values from the trickle context can be accessed by providing the argument in the format `<<contextVariableKey>>`.

#### .transform

Tranform the flowing object to another. The returned value becomes the new object flowing through the pipeline

#### .continue

Peek through the flowing object. The returned value has no affect on the flowing object.

#### .store

Store the arguments as part of the trickle context and can be used later as part of the same flow.

The values from the trickle context can be accessed by providing the argument in the format `<<contextVariableKey>>`

#### .done

The operations are not performed until done is called. The flow will start executing only after the call to done.

