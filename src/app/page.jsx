"use client";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { client, contractABI, contractAddress } from "./client";
import { useCallback, useEffect, useState } from "react";
import axios from "axios"
import { ethers } from "ethers";
import Link from "next/link";
import Image from "next/image";
import { BadgeCent, Ban, Menu, PanelRightClose, PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function Home() {
  const account = useActiveAccount();
  const [state, setState] = useState({
    provider: null,
    signer: null,
    contract: null,
  });

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (ethereum && account) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, contractABI, signer);

        setState({ provider, signer, contract });
        setTimeout(() => {
          getdata();
        }, 2000)
      } else {
        console.error("Ethereum object not found. Install a web3 wallet like MetaMask.");
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  const [isSidebarVisible, setSidebarVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [displaydata, setDisplayData] = useState([]);
  const [othersAddress, setOthersAddress] = useState("");
  const [othersAddress1, setOthersAddress1] = useState("");
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false)

  const toggleOpen = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarVisible((prev) => !prev);
  }, []);

  const handleFileChange = useCallback((event) => {
    setFile(event.target.files[0]);
  }, []);

  const giveAccess = async () => {
    try {
      setAdding(true)
      await state.contract.allow(othersAddress1);
      alert(`Access Granted to ${othersAddress1}`)
    }
    catch (err) {
      alert(err.message)
    }
    finally {
      setAdding(false)
      toggleOpen()
    }
  }

  const accessList = async () => {
    const addressList = await state.contract.shareAccess();
    setData(addressList)
  };

  useEffect(() => {
    state.contract && accessList();
  }, [state.contract]);


  const handleUpload = async (e) => {
    e.preventDefault();
    if (file && state.contract) {
      try {
        setLoading(true)
        const formData = new FormData();
        formData.append("file", file);
        const resFile = await axios({
          method: "post",
          url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
          data: formData,
          headers: {
            pinata_api_key: process.env.NEXT_PUBLIC_P_CLIENT_ID,
            pinata_secret_api_key: process.env.NEXT_PUBLIC_P_SECRET_KEY,
            "Content-Type": "multipart/form-data",
          },
        });
        const ImgHash = `https://gateway.pinata.cloud/ipfs/${resFile.data.IpfsHash}`;
        const transaction = await state?.contract.add(account.address, ImgHash);
        await transaction.wait();
        alert("Image Uploaded Successfully");
        setFile(null);
        getdata()
      } catch (e) {
        alert("Unable to upload image to Pinata");
        setFile(null);
      }
      finally {
        setLoading(false)
        setFile(null);
      }
    }
    else {
      alert("Select File First");
    }
  };

  const revokeAccess = async (address) => {
    try {
      setAdding(true);
      await state.contract.disallow(address);
      alert("User Removed Successfully!")
      accessList()
    }
    catch (err) {
      alert(`Error happenning while Revoking Access From the User ${err.message}`)
    }
    finally {
      setAdding(false)
    }
  }


  const getdata = async () => {
    let dataArray;
    if (account.address && state.contract) {
      try {
        if (othersAddress) {
          dataArray = await state.contract.display(othersAddress);
        } else {
          dataArray = await state.contract.display(account.address);
        }
      } catch (e) {
        alert(`You Don't Have Access to view Data of ${othersAddress || account.address}`);
        return;
      }
      const isEmpty = Object?.keys(dataArray).length === 0;
      if (!isEmpty) {
        const str = dataArray.toString();
        const str_array = str.split(",");
        console.log(str_array)
        setDisplayData(str_array);
      } else {
        alert("No image to display");
        return;
      }
    }
  };

  useEffect(() => {
    connectWallet();
  }, [account])

  useEffect(() => {
    if (account?.address && state?.contract) {
      getdata();
    }
  }, [othersAddress, account?.address])

  return (

    <div className={`${isSidebarVisible ? "md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]" : ""} grid min-h-screen w-full`}>
      {isSidebarVisible && (
        <div className="hidden border-r bg-muted/40 md:block">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
              <Link href="/" className="flex items-center gap-2 font-semibold">
                <BadgeCent className="h-6 w-6" />
                <span className="text-cyan-400">
                  BDrive
                </span>
              </Link>
              <Button
                variant="outline"
                size="icon"
                className="ml-auto h-8 w-8"
                onClick={toggleSidebar}
              >
                <PanelRightOpen />
              </Button>
            </div>
            <div className="flex-1">
              <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                {data?.length === 0 ? (
                  <span className="m-auto text-cyan-400">No User Found</span>
                ) : (
                  data?.map((user, index) => (
                    <div
                      key={index}
                      className={`mx-auto text-center flex items-center justify-between gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground`}
                    >
                      {user[1] && (
                        <>
                          {`${user[0].slice(0, 6)}...${user[0].slice(-6)}`}
                          <Ban onClick={() => revokeAccess(user[0])} className="text-red-400" />
                        </>
                      )}
                    </div>
                  ))
                )}
              </nav>
            </div>
          </div>
        </div>
      )}


      {open &&
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Give Access to the User</DialogTitle>
            </DialogHeader>

            <Input type="email" placeholder="Enter Address" onChange={(e) => setOthersAddress1(e.target.value)} value={othersAddress1} />

            <DialogFooter>
              <Button type="submit" disabled={adding} className="font-bold" onClick={giveAccess} >{adding ? "Permitting..." : "Permit"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }

      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                  <BadgeCent className="h-6 w-6" />
                  <span className="text-cyan-400">
                    BDrive
                  </span>
                </Link>

                {
                  data?.length === 0 ? <span className="m-auto text-cyan-400">No User Found</span> : <>

                    {data?.map((user, index) => (
                      <div
                        key={index}
                        className={`mx-auto text-center flex items-center justify-between gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground `}
                      >
                        {user[1] && (
                          <>
                            {`${user[0].slice(0, 6)}...${user[0].slice(-6)}`}
                            <Ban onClick={() => revokeAccess(user[0])} className="text-red-400" />
                          </>
                        )}
                      </div>
                    ))}
                  </>
                }
              </nav>
            </SheetContent>
          </Sheet>

          {
            !isSidebarVisible &&
            <PanelRightClose onClick={toggleSidebar} />
          }

          {
            (state && account) && <div className="w-full flex-1">
              <form onSubmit={handleUpload}>
                <div className="flex w-full max-w-sm items-center space-x-2">
                  <Input type="file" accept=".xls,.xlsx" onChange={handleFileChange} />
                  <Button type="submit" disabled={loading} className="font-bold">{
                    loading ? "Uploading..." : "Upload"
                  }</Button>
                </div>
              </form>
            </div>
          }

          {
            account?.address && <Button className="font-bold" onClick={toggleOpen}>Permit User</Button>
          }

          <DropdownMenu>
            <DropdownMenuTrigger asChild className="absolute right-4">
              <ConnectButton client={client} />
            </DropdownMenuTrigger>
          </DropdownMenu>
        </header>

        <div className="w-1/3 mx-auto mt-2">
          <Input type="email" placeholder="Enter Address" onChange={(e) => setOthersAddress(e.target.value)} value={othersAddress} />
        </div>

        {displaydata.length === 0 ? (
          <div className="flex flex-col gap-2 items-center justify-center my-auto text-center">
            <div className="text-4xl font-bold tracking-tight items-center text-orange-600">
              Welcome to BDrive!
            </div>
            <div className="text-xl font-bold tracking-tight items-center">
              Securely store, manage, and share your files on the blockchain. Your files are safe, private, and easily accessible anytime, anywhere.
            </div>
          </div>
        ) :
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
            {displaydata.map((url, i) => (
              <Image
                key={i}
                src={url}
                alt={`Image ${i + 1}`}
                width={100}
                height={100}
                layout="responsive"
              />
            ))}
          </div>
        }
      </div>
    </div>
  );
}