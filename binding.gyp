{
    "targets": [
        {
            "target_name": "attaqr",
            "sources": ["src/attaqr.cc"],
            "include_dirs": ["<!(node -p \"require('node-addon-api').include_dir\")", "src"],
            "dependencies": ["<!(node -p \"require('node-addon-api').gyp\")"],
            "cflags!": ["-fno-exceptions"],
            "cflags_cc!": ["-fno-exceptions"],
            "conditions": [
                ['OS=="mac"', {
                    "sources": ["src/macos/keyboard.cc", "src/macos/screen.cc"],
                    'cflags+': ['-fvisibility=hidden'],
                    "xcode_settings": {
                        "GCC_SYMBOLS_PRIVATE_EXTERN": "YES",  # -fvisibility=hidden
                        "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
                        "CLANG_CXX_LIBRARY": "libc++'",
                        "MACOSX_DEPLOYMENT_TARGET": "10.14",
                    }
                }],
                ['OS=="win"', {
                    "sources": ["src/windows/keyboard.cc", "src/windows/screen.cc"],
                    "msvs_settings": {
                        "VCCLCompilerTool": {"ExceptionHandling": 1},
                    }
                }]
            ]
        }
    ]
}
