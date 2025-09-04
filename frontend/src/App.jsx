// frontend/src/App.jsx
import React, { useState, useRef, useEffect } from 'react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// --- Icon Components for a professional look ---
const EditIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>;
const SaveIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
const CancelIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const RecordIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.5 12a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>;
const StopIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" /></svg>;
const DownloadIcon = () => <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const UploadIcon = () => <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4 4m0 0l-4 4m4-4H4" /></svg>;
const PlayIcon = () => <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" /></svg>;
const DeleteIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const NoRecordingsIcon = () => <svg className="mx-auto h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;

function App() {
    // State and Refs...
    const [isRecording, setIsRecording] = useState(false), [videoURL, setVideoURL] = useState(''), [timer, setTimer] = useState(0), [recordings, setRecordings] = useState([]), [modalIsOpen, setModalIsOpen] = useState(false), [selectedRecording, setSelectedRecording] = useState(null);
    const mediaRecorderRef = useRef(null), streamRef = useRef(null), micStreamRef = useRef(null), recordedChunksRef = useRef([]), timerIntervalRef = useRef(null);
    const [editingId, setEditingId] = useState(null), [newTitle, setNewTitle] = useState('');

    // Logic functions (compacted for neatness)...
    const startRecording = async () => { try { const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: { mediaSource: "tab" }, audio: true }); const micStream = await navigator.mediaDevices.getUserMedia({ audio: true }); streamRef.current = displayStream; micStreamRef.current = micStream; const combinedStream = new MediaStream([...displayStream.getVideoTracks(), ...micStream.getAudioTracks()]); const mediaRecorder = new MediaRecorder(combinedStream); mediaRecorderRef.current = mediaRecorder; mediaRecorder.ondataavailable = e => e.data.size > 0 && recordedChunksRef.current.push(e.data); mediaRecorder.onstop = () => { const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' }); setVideoURL(URL.createObjectURL(videoBlob)); recordedChunksRef.current = []; displayStream.getTracks().forEach(t => t.stop()); micStream.getTracks().forEach(t => t.stop()); }; mediaRecorder.start(); setIsRecording(true); startTimer(); } catch (error) { console.error("Error starting recording:", error); } };
    const stopRecording = () => { if (mediaRecorderRef.current) { mediaRecorderRef.current.stop(); setIsRecording(false); stopTimer(); } };
    const startTimer = () => { setTimer(0); timerIntervalRef.current = setInterval(() => { setTimer(t => { if (t >= 180) { stopRecording(); return t; } return t + 1; }); }, 1000); };
    const stopTimer = () => clearInterval(timerIntervalRef.current);
    const formatTime = s => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
    const uploadRecording = async () => { if (!videoURL) return; const blob = await fetch(videoURL).then(r => r.blob()); const formData = new FormData(); formData.append('video', blob, 'recording.webm'); try { const res = await fetch(`${API_URL}/api/recordings`, { method: 'POST', body: formData }); if (!res.ok) throw new Error('Upload failed'); alert('Upload successful!'); setVideoURL(''); fetchRecordings(); } catch (error) { console.error("Error uploading:", error); alert('Upload failed.'); } };
    const fetchRecordings = async () => { try { const res = await fetch(`${API_URL}/api/recordings`); setRecordings(await res.json()); } catch (error) { console.error("Error fetching recordings:", error); } };
    useEffect(() => { fetchRecordings(); }, []);
    const formatSize = b => { if (b === 0) return '0 Bytes'; const i = Math.floor(Math.log(b) / Math.log(1024)); return `${parseFloat((b / Math.pow(1024, i)).toFixed(2))} ${['Bytes','KB','MB'][i]}`; };
    const openModal = r => { setSelectedRecording(r); setModalIsOpen(true); };
    const closeModal = () => { setModalIsOpen(false); setSelectedRecording(null); };
    const handleEditClick = r => { setEditingId(r.id); setNewTitle(r.title); };
    const handleTitleChange = e => setNewTitle(e.target.value);
    const handleTitleSave = async (recordingId) => { try { const res = await fetch(`${API_URL}/api/recordings/${recordingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newTitle }), }); if (!res.ok) throw new Error('Failed to update title'); setEditingId(null); fetchRecordings(); } catch (error) { console.error("Error updating title:", error); alert("Failed to save title."); } };
    const handleDelete = async (recordingId) => { if (window.confirm('Are you sure you want to permanently delete this recording?')) { try { const response = await fetch(`${API_URL}/api/recordings/${recordingId}`, { method: 'DELETE', }); if (!response.ok) throw new Error('Failed to delete recording'); alert('Recording deleted successfully.'); fetchRecordings(); } catch (error) { console.error("Error deleting recording:", error); alert('Failed to delete recording.'); } } };

    return (
        <div className="min-h-screen text-slate-50 font-sans p-4 sm:p-8">
            <div className="container mx-auto max-w-4xl">
                <header className="text-center mb-10">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 pb-2">
                        Screen Recorder
                    </h1>
                    <p className="text-slate-400">
                        Instantly record, preview and download your clips.
                    </p>
                </header>

                <main>
                    <section className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 mb-8 shadow-2xl">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-center sm:text-left">
                                <h2 className="text-2xl font-bold">Controls</h2>
                                <p className="text-slate-400">Press the button to start or stop recording.</p>
                            </div>
                            <div className="flex items-center space-x-4">
                                {isRecording && <div className="text-xl font-mono bg-slate-900/50 text-cyan-400 px-4 py-2 rounded-lg border border-slate-700">{formatTime(timer)}</div>}
                                <button
                                    onClick={isRecording ? stopRecording : startRecording}
                                    className={`relative inline-flex items-center justify-center px-6 py-3 font-bold rounded-lg text-lg transition-all duration-200 ease-in-out group focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                                        isRecording
                                            ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 focus-visible:ring-red-500'
                                            : 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/30 focus-visible:ring-green-500'
                                    }`}
                                >
                                  {isRecording && <span className="absolute -top-1 -right-1 flex h-4 w-4"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span></span>}
                                  {isRecording ? <StopIcon /> : <RecordIcon />}
                                  <span className="ml-2">{isRecording ? 'Stop' : 'Record'}</span>
                                </button>
                            </div>
                        </div>
                    </section>
                    
                    {videoURL && <section className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 mb-8 shadow-2xl animate-fade-in"><h2 className="text-2xl font-bold mb-4">Preview</h2><video src={videoURL} controls className="w-full rounded-lg mb-4 bg-black"></video><div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4"><a href={videoURL} download="recording.webm" className="flex-1"><button className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 px-6 py-3 font-bold rounded-lg text-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><DownloadIcon/>Download</button></a><button onClick={uploadRecording} className="flex-1 flex items-center justify-center bg-purple-600 hover:bg-purple-700 px-6 py-3 font-bold rounded-lg text-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"><UploadIcon/>Upload</button></div></section>}

                    <section className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 shadow-2xl">
                        <h2 className="text-2xl font-bold mb-4">Uploaded Recordings</h2>
                        {recordings.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b-2 border-slate-700">
                                            <th className="p-4 text-slate-300 font-semibold">Title</th>
                                            <th className="p-4 text-slate-300 font-semibold hidden sm:table-cell">Size</th>
                                            <th className="p-4 text-slate-300 font-semibold hidden md:table-cell">Created Date (IST)</th>
                                            <th className="p-4 text-slate-300 font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recordings.map(rec => (
                                            <tr key={rec.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                                                <td className="p-4 font-medium">
                                                    {editingId === rec.id ? (
                                                        <div className="flex items-center gap-2"><input type="text" value={newTitle} onChange={handleTitleChange} className="bg-slate-900 border border-slate-600 rounded px-2 py-1 w-full" autoFocus /><button onClick={() => handleTitleSave(rec.id)} className="p-2 text-green-400 hover:text-green-300"><SaveIcon /></button><button onClick={() => setEditingId(null)} className="p-2 text-red-400 hover:text-red-300"><CancelIcon /></button></div>
                                                    ) : (
                                                        <div className="flex items-center gap-3"><span>{rec.title}</span><button onClick={() => handleEditClick(rec)} className="text-slate-500 hover:text-cyan-400"><EditIcon /></button></div>
                                                    )}
                                                </td>
                                                <td className="p-4 text-slate-400 hidden sm:table-cell">{formatSize(rec.filesize)}</td>
                                                <td className="p-4 text-slate-400 hidden md:table-cell">{new Date(rec.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
                                                <td className="p-4 text-right">
                                                    <div className="flex justify-end items-center gap-2">
                                                        <button onClick={() => openModal(rec)} className="inline-flex items-center bg-cyan-600 hover:bg-cyan-700 text-slate-50 px-3 py-2 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"><PlayIcon /> Play</button>
                                                        <button onClick={() => handleDelete(rec.id)} className="p-2 text-slate-500 hover:text-red-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-full"><DeleteIcon /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 px-4"><NoRecordingsIcon /><h3 className="mt-4 text-lg font-bold text-white">No recordings yet</h3><p className="mt-1 text-sm font-bold text-slate-400">Record and upload a video to see it here.</p></div>
                        )}
                    </section>
                </main>
                <footer className="text-center mt-10 text-slate-500 text-sm">
                    <p>Developed by Jyotsna • Built with React, Node.js & Tailwind CSS</p>
                </footer>
            </div>
            {modalIsOpen && selectedRecording && <div className="modal-overlay" onClick={closeModal}><div className="modal-content" onClick={e => e.stopPropagation()}><button className="modal-close-button" onClick={closeModal}>&times;</button><h3 className="text-xl font-bold">Playing {selectedRecording.title}</h3><video src={`${API_URL}/${selectedRecording.filepath}`} controls autoPlay className="w-full h-auto max-h-[80vh] bg-black rounded"/></div></div>}
        </div>
    );
}

export default App;