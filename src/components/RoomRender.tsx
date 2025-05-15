import React, { useEffect, useRef, useState } from 'react';  
import { Scene, Engine, Vector3, ArcRotateCamera, HemisphericLight, SceneLoader } from '@babylonjs/core';  
import { SceneManager } from '../core/SceneManager';  
import { IAssetManifest_MyRoom } from '../models/types';  
import LoadingScreen from './LoadingScreen';  
import RoomStats from './RoomStats';  
import HelpButton from './HelpButton';  
import FullscreenButton from './FullscreenButton';  
  
interface RoomRendererProps {  
  roomManifest: IAssetManifest_MyRoom;  
  onSceneReady?: () => void;  
  width?: string;  
  height?: string;  
  backgroundColor?: string;  
}  
  
const RoomRenderer: React.FC<RoomRendererProps> = ({  
  roomManifest,  
  onSceneReady,  
  width = '100%',  
  height = '100%',  
  backgroundColor = '#6b8cc2'  
}) => {  
  const canvasRef = useRef<HTMLCanvasElement>(null);  
  const engineRef = useRef<Engine | null>(null);  
  const sceneRef = useRef<Scene | null>(null);  
  const [loadingProgress, setLoadingProgress] = useState(0);  
  const [isLoading, setIsLoading] = useState(true);  
  
  useEffect(() => {  
    if (!canvasRef.current) return;  
  
    // Khởi tạo BabylonJS engine và scene  
    engineRef.current = new Engine(canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true });  
    sceneRef.current = new Scene(engineRef.current);  
      
    // Set up loading progress tracking  
    const onProgress = (evt: any) => {  
      if (evt.lengthComputable) {  
        const loadingPercentage = (evt.loaded * 100 / evt.total).toFixed();  
        setLoadingProgress(Number(loadingPercentage));  
      }  
    };  
      
    // Register the event  
    SceneLoader.OnPluginActivatedObservable.add((plugin) => {  
      plugin.onParsedObservable.add(onProgress);  
    });  
      
    // Tạo camera  
    const camera = new ArcRotateCamera(  
      "camera",   
      -Math.PI / 2,   
      Math.PI / 3,   
      10,   
      new Vector3(0, 0, 0),   
      sceneRef.current  
    );  
    camera.attachControl(canvasRef.current, true);  
    camera.lowerRadiusLimit = 2;  
    camera.upperRadiusLimit = 20;  
      
    // Tạo ánh sáng  
    const light = new HemisphericLight(  
      "light",   
      new Vector3(0, 1, 0),   
      sceneRef.current  
    );  
    light.intensity = 0.7;  
  
    // Khởi tạo SceneManager  
    SceneManager.initializeScene({  
      scene: sceneRef.current,  
      type: 'ROOM',  
      onSuccess: () => {  
        // Load room manifest  
        setIsLoading(true);  
        SceneManager.Room?.initializeMyRoom(roomManifest, false, () => {  
          console.log('Room loaded successfully');  
          setIsLoading(false);  
          if (onSceneReady) onSceneReady();  
        });  
      }  
    });  
  
    // Render loop  
    engineRef.current.runRenderLoop(() => {  
      if (sceneRef.current) {  
        sceneRef.current.render();  
      }  
    });  
  
    // Resize handler  
    const handleResize = () => {  
      if (engineRef.current) {  
        engineRef.current.resize();  
      }  
    };  
  
    window.addEventListener('resize', handleResize);  
  
    // For manual progress updates when SceneLoader events aren't triggered  
    if (isLoading) {  
      const progressInterval = setInterval(() => {  
        // Increment progress artificially if it's stuck  
        setLoadingProgress(prev => {  
          if (prev < 100) {  
            return Math.min(prev + 5, 95); // Max out at 95% until actually complete  
          }  
          return prev;  
        });  
          
        // Check if loading is complete  
        if (!isLoading) {  
          clearInterval(progressInterval);  
          setLoadingProgress(100);  
        }  
      }, 500);  
        
      return () => clearInterval(progressInterval);  
    }  
  
    return () => {  
      window.removeEventListener('resize', handleResize);  
        
      // Cleanup  
      if (SceneManager.isInit('ROOM')) {  
        SceneManager.finalize('ROOM');  
      }  
        
      engineRef.current?.dispose();  
    };  
  }, []);  
  
  // Effect để cập nhật room khi manifest thay đổi  
  useEffect(() => {  
    if (SceneManager.isInit('ROOM') && roomManifest) {  
      setIsLoading(true);  
      SceneManager.Room?.clearMyRoom();  
      SceneManager.Room?.initializeMyRoom(roomManifest, false, () => {  
        console.log('Room updated successfully');  
        setIsLoading(false);  
      });  
    }  
  }, [roomManifest]);  
  
  return (  
    <>  
      <canvas   
        ref={canvasRef}   
        style={{   
          width,   
          height,   
          backgroundColor,  
          display: 'block'  
        }}   
      />  
      <LoadingScreen isVisible={isLoading} progress={loadingProgress} />  
      {!isLoading && <RoomStats />}  
      <HelpButton />  
      <FullscreenButton />  
    </>  
  );  
};  
  
export default RoomRenderer;