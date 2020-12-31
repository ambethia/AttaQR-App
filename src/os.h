#pragma once
#ifndef OS_H
#define OS_H

#if !defined(IS_MACOS) && defined(__MACH__)
#define IS_MACOS
#endif

#if !defined(IS_WIN32) && defined(_WIN32)
#define IS_WIN32
#endif

#endif // OS_H