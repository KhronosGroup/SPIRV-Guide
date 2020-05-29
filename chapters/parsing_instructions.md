# Parsing Instructions

> This chapter goes over tips for parsing a stream of SPIR-V instructions
>
> SPIR-V Tools has a reference parser found in [binary.cpp](https://github.com/KhronosGroup/SPIRV-Tools/blob/master/source/binary.cpp)

Parsing of SPIR-V consists of 2 main components, the header and the instructions.

## Header

Because of the known magic number as the first dword in the module, this can be used to decide if the module is big or little endianness.

From here parsing the header is a simple as the following pseudo code:
```
// spvFixWord used to handle endianness
uint32_t magic     = spvFixWord(binary[SPV_INDEX_MAGIC_NUMBER], endian);
uint32_t version   = spvFixWord(binary[SPV_INDEX_VERSION_NUMBER], endian);
uint32_t generator = spvFixWord(binary[SPV_INDEX_GENERATOR_NUMBER], endian);
uint32_t bound     = spvFixWord(binary[SPV_INDEX_BOUND], endian);
uint32_t schema    = spvFixWord(binary[SPV_INDEX_SCHEMA], endian);
```
