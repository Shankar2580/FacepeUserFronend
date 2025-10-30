# Face Registration Instruction Images Setup

## 📸 Required Images

To complete the enhanced face registration instruction modal, you need to add the following images to your project:

### 1. Good Lighting Instruction Image
- **File Path**: `PayByFaeAi/assets/images/facerec1.png`
- **Purpose**: Shows user with good lighting setup and no sunglasses
- **Recommended Size**: 300x300px minimum
- **Content**: Should show:
  - Person with good lighting on face
  - No sunglasses or face coverings
  - Clear, well-lit environment

### 2. Eye Level Positioning Image  
- **File Path**: `PayByFaeAi/assets/images/facerec2.png`
- **Purpose**: Shows proper camera positioning at eye level
- **Recommended Size**: 300x300px minimum
- **Content**: Should show:
  - Person holding device at eye level
  - Proper distance (12-18 inches)
  - Face centered in frame

## 🚀 How to Add the Images

1. **Create the images folder** (if it doesn't exist):
   ```
   PayByFaeAi/assets/images/
   ```

2. **Add your two images**:
   - `facerec1.png`
   - `facerec2.png`

3. **Test the modal** - The images will automatically display in the instruction steps

## 📱 Features Added

### ✅ **Enhanced Visual Instructions**
- **Real Images**: Shows actual instruction images instead of just icons
- **Fallback Icons**: If images fail to load, icons still appear
- **Professional Layout**: Images are nicely framed with gradients

### ✅ **Tablet Responsive Design**
- **Larger Images**: 300x300px on tablets (vs 200x200px on phones)
- **Better Spacing**: Increased padding and margins for tablets
- **Larger Text**: All text sizes scale up for tablet screens
- **Optimal Layout**: Content centers properly on larger screens

### ✅ **Improved UX**
- **Better Tips**: More detailed and helpful instructions
- **Clear Progression**: Enhanced step indicators and progress dots
- **Professional Polish**: Better gradients, shadows, and animations

## 🔧 Technical Implementation

The modal now automatically detects tablet screens (width >= 768px) and applies:
- Larger image sizes
- Increased text sizes
- Better spacing and padding
- Responsive layout constraints

## 💡 Image Creation Tips

If you need to create the instruction images:

1. **Good Lighting Image**:
   - Show a person in good lighting
   - Face clearly visible
   - No sunglasses or hat
   - Maybe show good vs bad lighting examples

2. **Eye Level Image**:
   - Show hands holding phone at eye level
   - Side view works well
   - Maybe show distance indicators
   - Face should be centered in phone screen

The images you provided earlier are perfect for this! Just save them with the filenames above. 