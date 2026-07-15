// import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
// import { checkEmail } from "../../apis/users";
// import { useAppSelector } from "../../hooks";
// import { useState, useEffect, useRef } from "react";
// import { JsonError } from "../../interfaces";
// import ForgotCard1 from "./ForgotCard1";
// import ForgotCard2 from "./ForgotCard2";
// import ForgotCard3 from "./ForgotCard3";

// interface Props {
//   open: boolean;
//   setOpen: (open: boolean) => void;
// }

// const ForgotPassword = ({ open, setOpen }: Props) => {
//   const [email, setEmail] = useState("");
//   const [error, setError] = useState("");
//   const [userid, setUserid] = useState(0);
//   const [question, setQuestion] = useState("");
//   const [answer, setAnswer] = useState("");
//   const [pageWidth, setPageWidth] = useState(0);
//   const [step, setStep] = useState<number>(0);
//   const context = useAppSelector((state) => state.app);
//   const [style, setStyle] = useState<string>("hidden");

//   const pageRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {});

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       if (email) {
//         testEmail();
//       }
//     }, 500);

//     if (pageRef.current) {
//       const box = pageRef.current.getBoundingClientRect();
//       setPageWidth(box.width);
//     }
//     const page = document.querySelector('[query-id="answer-page"]');

//     page?.scrollTo({
//       top: 0,
//       left: 0,
//       behavior: "smooth",
//     });
//     return () => {
//       clearTimeout(timer);
//     };
//   }, [email]);

//   const testEmail = () => {
//     const div = document.querySelector('[query-id="email-confirmed-button"]');
//     checkEmail(context.url, email)
//       .then((resp) => {
//         const j = resp.data;
//         if (j.error == "0") {
//           setError("");
//           setStep(1);
//           setUserid(j.userid);
//           setQuestion(j.question);

//           div?.setAttribute("data-disabled", "false");
//         } else {
//           setError(j.msg);
//           setStep(0);
//           div?.setAttribute("data-disabled", "true");
//         }
//       })
//       .catch((e: JsonError) => {
//         setError(e.message);
//         setStep(0);
//         div?.setAttribute("data-disabled", "true");
//       });
//   };

//   const handleClick = () => {
//     const page = document.querySelector('[query-id="answer-page"]');

//     if (page) {
//       page.scrollTo({
//         top: 0,
//         left: pageWidth,
//         behavior: "smooth",
//       });
//     }
//   };

//   const handleAnswerFinished = () => {
//     const page = document.querySelector('[query-id="answer-page"]');
//     setStyle("inline-block");

//     if (page) {
//       page.scrollTo({
//         top: 0,
//         left: pageWidth * 2,
//         behavior: "smooth",
//       });
//     }
//   };

//   return (
//     <Dialog open={open} onClose={setOpen} className="relative z-10">
//       <DialogBackdrop
//         transition
//         className="fixed inset-0 bg-gray-500/75 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-300 data-[enter]:ease-out data-[leave]:ease-in"
//       />

//       <div className="fixed inset-0 z-10 w-screen">
//         <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
//           <DialogPanel
//             query-id="answer-page"
//             transition
//             ref={pageRef}
//             className=" relative transform overflow-hidden rounded-lg bg-custom-white text-left shadow-xl transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in sm:my-8 sm:w-full sm:max-w-lg data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95 cursor-pointer"
//           >
//             <div className="whitespace-nowrap">
//               <div className="inline-block w-full ">
//                 <ForgotCard1
//                   step={step}
//                   email={email}
//                   setEmail={setEmail}
//                   error={error}
//                   handleClick={handleClick}
//                 />
//               </div>
//               <div className="inline-block w-full">
//                 <ForgotCard2
//                   error={error}
//                   userid={userid}
//                   answer={answer}
//                   setError={setError}
//                   question={question}
//                   setAnswer={setAnswer}
//                   handleClick={handleAnswerFinished}
//                 />
//               </div>
//               <div className="inline-block w-full">
//                 <ForgotCard3
//                   error={error}
//                   userid={userid}
//                   answer={answer}
//                   setAnswer={setAnswer}
//                   setError={setError}
//                   question={question}
//                   style={style}
//                 />
//               </div>
//             </div>
//           </DialogPanel>
//         </div>
//       </div>
//     </Dialog>
//   );
// };

// export default ForgotPassword;
