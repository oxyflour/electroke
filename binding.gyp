{
  'targets': [
    {
      'target_name': 'hook',
      'sources': [ 'binding/hook.cc' ],
      'libraries': [ '-lShlwapi.lib', '-lKernel32.lib', '-lPsapi.lib' ],
      'include_dirs': [ 'node_modules/nan' ],
    },
    {
      'target_name': 'helper',
      'sources': [ 'binding/helper.cc' ],
      'libraries': [ '-lShlwapi.lib', '-lKernel32.lib', '-lPsapi.lib' ],
      'include_dirs': [ 'node_modules/nan' ],
    },
  ],
}