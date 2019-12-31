import readline from 'readline';
import { parse } from './parser';
import Repl from './repl';
import { valueToString } from './expression';

function main(): void {
  const repl = new Repl();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> ',
  });

  rl.prompt();

  rl.on('line', line => {
    const matchResult = line.match(/^:(\w+)$/);
    if (matchResult === null) {
      try {
        const expression = parse(line);
        const [type, value] = repl.evaluate(expression);
        console.log(`${valueToString(value)} :: ${type.toString()}`);
      } catch (e) {
        console.log('Error occurred', e);
      }
    } else {
      const command = matchResult[1];
      switch (command) {
        case 'exit':
        case 'quit':
        case 'q':
          rl.emit('close');
          return;
        case 'env':
          repl.env.forEach((type, name) => console.log(`${name}: ${type.toString()}`));
          break;
        case 'verbose':
        case 'v':
          repl.verbose = !repl.verbose;
          console.log(`Turned ${repl.verbose ? 'on' : 'off'} verbose mode.`);
          break;
        default:
          console.log(`Unknown command: ${command}`);
          break;
      }
    }
    rl.prompt();
  }).on('close', () => {
    console.log('Have a nice day!');
    process.exit(0);
  });
}

main();
