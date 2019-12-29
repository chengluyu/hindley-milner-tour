# A Tour of Hindley Milner Type System

This repository holds my implementation of a Hindley-Milner type system and corresponding type inference algorithm.

## References and Comments

* *[Hindley–Milner type system Wikipedia](https://en.wikipedia.org/wiki/Hindley%E2%80%93Milner_type_system)* This is unhelpful IMHO. I guess there's something inside it that makes me sleepy.
* *[Top Quality Type Error Messages](https://dspace.library.uu.nl/bitstream/handle/1874/7297/?sequence=7)*
* *[Algorithm W Step by Step](http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.65.7733&rep=rep1&type=pdf)*
* *[Hindley-Milner type system/Algorithm W study](https://boxbase.org/entries/2018/mar/5/hindley-milner/)*

Existing implementations:

* [Algorithm W in Literate Haskell](https://gist.github.com/paf31/a49a54d7ea5ede43422f)

## Memorandum

- [ ] Finish basic infrastructure of the type system
- [ ] Finish the basic inference algorithm (either constraint-based or substitution-based)
- [ ] Implement inference on recursive functions
- [ ] Implement inference on mutually recursive functions
- [ ] Make an online REPL single-page application and host it on GitHub pages
