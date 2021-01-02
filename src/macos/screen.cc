#include <CoreGraphics/CoreGraphics.h>
#include "screen.h"

// Capture a given portion of the screen
CaptureWorker::CaptureWorker(AQRect captureArea, Napi::Function &cb) : Napi::AsyncWorker(cb), captureArea(captureArea)
{
  CGRect rect = CGRectMake(captureArea.origin.x, captureArea.origin.y, captureArea.size.height, captureArea.size.width);
  imageRef = CGDisplayCreateImageForRect(CGMainDisplayID(), rect);
}

// Capture the full screen
CaptureWorker::CaptureWorker(Napi::Function &cb) : Napi::AsyncWorker(cb)
{
  imageRef = CGDisplayCreateImage(kCGDirectMainDisplay);
}

void CaptureWorker::Execute()
{
  dataRef = CGDataProviderCopyData(CGImageGetDataProvider(imageRef));
  width = CGImageGetWidth(imageRef);
  height = CGImageGetHeight(imageRef);
  length = CFDataGetLength(dataRef);
  bytesPerRow = CGImageGetBytesPerRow(imageRef);
  bytesPerPixel = CGImageGetBitsPerPixel(imageRef) / 8;
  buffer = new uint8_t[length];
  CFDataGetBytes(dataRef, CFRangeMake(0, CFDataGetLength(dataRef)), buffer);
};

void CaptureWorker::OnOK()
{
  Napi::Buffer<uint8_t> data = Napi::Buffer<uint8_t>::New(
      Env(),
      buffer,
      length,
      [](Napi::Env /*env*/, void *finalizeData) {
        delete[] static_cast<uint8_t *>(finalizeData);
      });

  Napi::Object imageData = Napi::Object::New(Env());
  imageData.Set("width", Napi::Number::New(Env(), width));
  imageData.Set("height", Napi::Number::New(Env(), height));
  imageData.Set("bytesPerRow", Napi::Number::New(Env(), bytesPerRow));
  imageData.Set("bytesPerPixel", Napi::Number::New(Env(), bytesPerPixel));
  imageData.Set("data", data);

  Callback().Call({imageData});

  CGImageRelease(imageRef);
  CFRelease(dataRef);
};
