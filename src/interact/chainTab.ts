import Interactive from "./Interactive";

export default function chainTab(
  a: Interactive,
  b: Interactive,
  swappedOut?: Interactive[]
): void {
  if (swappedOut) {
    swappedOut[0] = a ? a.interact()._nextInteractive : null;
    swappedOut[1] = b ? b.interact()._prevInteractive : null;
  }
  // console.log(a, b);
  if (a) {
    a.interact()._nextInteractive = b;
  }
  if (b) {
    b.interact()._prevInteractive = a;
  }
}

export function chainTabs(...args: Interactive[]): void {
  if (args.length < 2) {
    return;
  }
  const first: Interactive = args[0];
  const last: Interactive = args[args.length - 1];

  for (let i = 0; i <= args.length - 2; ++i) {
    chainTab(args[i], args[i + 1]);
  }
  chainTab(last, first);
}

