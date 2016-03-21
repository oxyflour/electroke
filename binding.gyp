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
    {
      'target_name': 'copy_to_bin',
      'dependencies': [ 'hook', 'helper' ],
      'type': 'none',
      'copies': [
        {
          'destination': 'bin',
          'files': [ '<(PRODUCT_DIR)/hook.node', '<(PRODUCT_DIR)/helper.node' ],
        },
      ]
    },
  ],
}