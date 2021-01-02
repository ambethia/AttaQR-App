#pragma once
#ifndef SCREEN_H
#define SCREEN_H

#if defined(IS_WINDOWS)
#include <Windows.h>
#endif
#include <napi.h>

#include "attaqr.h"

class CaptureWorker : public Napi::AsyncWorker
{
public:
  CaptureWorker(Napi::Function &cb);
  CaptureWorker(AQRect rect, Napi::Function &cb);
  void Execute();
  void OnOK();
  int x;
  int y;
  int w;
  int h;
  Napi::Function *cb;

private:
  AQRect captureArea;
  uint8_t *buffer;
  int height;
  int width;
  size_t bytesPerRow;
  uint8_t bytesPerPixel;
#if defined(IS_MACOS)
  // TODO: Can maybe refactor this stuff to all be in Execute()?
  CFDataRef dataRef;
  CGImageRef imageRef;
  CFIndex length;
#endif
};

#endif // SCREEN_H