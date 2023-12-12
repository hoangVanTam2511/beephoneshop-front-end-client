import React, { useState, useEffect } from 'react'
import './CartPage.scss'
import { shopping_cart } from '../../utils/images'
import { Link } from 'react-router-dom'
import { Divider } from 'antd'
import axios from 'axios'
import { addToCart, SetSelectedCart } from '../../store/cartSlice'
import Button from '@mui/material/Button'
import { useDispatch, useSelector } from 'react-redux'
import { getUser } from '../../store/userSlice'
import { addProductToCart, removeProductToCart, deleteProduct } from '../../store/cartDetailSlice'
import { ResetItemNavbar } from '../../store/navbarSlice'
import toast, { Toaster } from 'react-hot-toast'
import { request, setAuthHeader } from '../../helpers/axios_helper'

const CartPage = () => {
  // const { itemsCount, totalAmount } = useSelector(state => state.cart)
  const [productDetails, setProductDetails] = useState([])
  const [totalAmount, setTotalAmount] = useState()
  const [changeCount, setChangeCount] = useState(new Map())
  const dispatch = useDispatch()
  const user = getUser()

  // redux
  const productDetailsRedux = useSelector(state => state.cartDetail.products)
  const quantityRedux = useSelector(state => state.cartDetail.quantity)
  const totalAmountRedux = useSelector(state => state.cartDetail.totalAmount)

  const getProductDetails = async () => {
    if (productDetails.length !== 0) return
    if(user.id === ''){

    }else{
      request("GET",`/client/cart-detail/get-cart-details?id_customer=${user.id}`)
      .then(res => {
        setProductDetails(res.data)
        var totalCart = 0
        if (res.data.length === 0) return
        res.data.map(e => {
          totalCart +=
            Number(
              e.donGiaSauKhuyenMai === 0 ? e?.donGia : e?.donGiaSauKhuyenMai
            ) * Number(e.soLuongSapMua)
        })

        setTotalAmount(totalCart)
        setChangeCount(
          new Map(
            res.data.map(item => [item.idSanPhamChiTiet, item.soLuongSapMua])
          )
        )
      })
      .catch(res => console.log(res))
    }
  }

  const countTotalAmountAgain = () => {
    var totalCart = 0
    productDetails.map(e => {
      totalCart +=
        Number(
          e?.donGiaSauKhuyenMai === 0 ? e?.donGia : e?.donGiaSauKhuyenMai
        ) * Number(changeCount.get(e.idSanPhamChiTiet))
    })
    setTotalAmount(totalCart)
  }

  useEffect(() => {
    if (user.id !== null || user.id !== '') {
      getProductDetails()
    }
    console.log(productDetailsRedux)
    countTotalAmountAgain()
    dispatch(addToCart())
    dispatch(SetSelectedCart(1))
    dispatch(ResetItemNavbar())
  }, [totalAmount])

  const formatMoney = number => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(number)
  }

  if (user.id === '' ? productDetailsRedux.length === 0 : productDetails.length === 0) {
    return (
      <div className='container my-5'>
        <div className='empty-cart flex justify-center align-center flex-column font-manrope'>
          <img src={shopping_cart} alt='' />
          <span className='fw-6 fs-15 '>Giỏ hàng đang trống.</span>
          <Link
            to='/'
            className='shopping-btn text-white fw-5'
            style={{
              backgroundColor: `#128DE2`,
              border: '1px solid #128DE2',
              borderRadius: '10px'
            }}
          >
            Đi tới trang chủ
          </Link>
        </div>
      </div>
    )
  }

  const handlePlusCart = async product => {
    if(user.id === ''){
      if (product.data.quantityInventory < quantityRedux + 1) {
        toast.error(
          "Không còn đủ sản phẩm trong kho. Vui lòng chọn sản phẩm khác"
        )
      } else {
        if(product.quantity >3){
          toast.error(
            "Vượt quá số lượng cho phép"
          )
        }else{
          dispatch(addProductToCart(product.data))
        }
      }
    }else{
    if (product.soLuongTonKho < changeCount.get(product.idSanPhamChiTiet) + 1) {
      toast.error(
        "Không còn đủ sản phẩm trong kho. Vui lòng chọn sản phẩm khác"
      )
    } else {
      var id = product.idSanPhamChiTiet
      request("POST",`/client/cart-detail/add-to-cart?id_customer=${user.id}&id_product_detail=${id}&type=plus`)
        .then(res => {
          if (res.status === 200) {
            var temp = Number(changeCount.get(id)) + 1
            setChangeCount(map => new Map(map.set(id, temp)))
            countTotalAmountAgain()
          }
        })
        .catch(res =>
          toast.error(
            'Vượt quá số lượng cho phép'
          )
        )
    }
  }
  }

  const handleMinusCart = async product => {
    if(user.id === ''){
      dispatch(removeProductToCart(product.data))
    }else{
    var id = product.idSanPhamChiTiet
    const countOfProductDetail = changeCount.get(product.idSanPhamChiTiet)
    if (countOfProductDetail === 1) {
      deleteCartDetail(product)
    } else {
      request("POST",`/client/cart-detail/add-to-cart?id_customer=${user.id}&id_product_detail=${id}&type=minus`)
        .then(res => {
          if (res.status === 200) {
            var temp = Number(changeCount.get(id)) - 1
            setChangeCount(map => new Map(map.set(id, temp)))
            countTotalAmountAgain()
          }
        })
        .catch(res => {})
    }
  }
  }

  const deleteCartDetail = async product => {
    console.log(product)

    if(user.id === ""){
        dispatch(deleteProduct(product))
    }else{
      if (productDetails.length === 1) {
        dispatch(addToCart(0))
      }

      if (product.idGioHangChiTiet !== null) {
         request("DELETE",`/client/cart-detail/delete-cart-details?id_customer=${user.id}&id_cart_detail=${product.idGioHangChiTiet}`)
          .then(res => {
            setProductDetails(res.data)
            var totalCart = 0
            if (res.data.length === 0) return
            res.data.map(e => {
              totalCart +=
                Number(
                  e.donGiaSauKhuyenMai === 0 ? e?.donGia : e?.donGiaSauKhuyenMai
                ) * Number(e.soLuongSapMua)
            })
            setTotalAmount(totalCart)
            dispatch(addToCart())
          })
          .catch(res => console.log(res))
      }
    }
   
  }

  return (
    <>
      <h3
        className='text-center fw-5'
        style={{ marginTop: 20, transform: 'translateY(17px)' }}
      >
        <span></span>

        <span style={{ fontWeight: 600 }}>Giỏ hàng của bạn</span>
      </h3>
      <Divider
        style={{ margin: ' 20px auto', width: '48%', minWidth: '47%' }}
      />
      <div
        className='cart bg-white'
        style={{ margin: `20px auto`, width: `50%`, borderRadius: '20px' }}
      >
        <div className='container'>
          <div className='cart-ctable'>
            <div className='cart-cbody bg-white'>
              {user.id !== '' && productDetails.map(product => {
                return (
                  <>
                    <div
                      className='cart-ctr'
                      key={product?.id}
                      style={{ marginTop: 10 }}
                    >
                      <div className='cart-ctd'>
                        <img
                          style={{ width: 112, height: 115 }}
                          src={product?.duongDan}
                        />

                        <button
                          type='button'
                          className='delete-btn text-dark'
                          onClick={() => deleteCartDetail(product)}
                          style={{
                            color: '#999',
                            position: 'relative',
                            right: '-42px',
                            marginTop: '7px'
                          }}
                        >
                          <i class='fa-regular fa-circle-xmark'></i> Xóa
                        </button>
                      </div>
                      <div
                        className='cart-ctd'
                        style={{ position: 'relative', top: '0px' }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            width: 550,
                            height: 140,
                            marginLeft: 10
                          }}
                        >
                          <div style={{ width: '127%' }}>
                            <span className='cart-ctxtf fw-7'>
                              {product?.tenSanPham +
                                ' ' +
                                product?.dungLuongRam +
                                'GB ' +
                                product?.dungLuongRom +
                                'GB'}
                            </span>
                            <br />
                            <span>Màu : {product.tenMauSac}</span>
                          </div>
                          <div style={{ width: '58%' }}>
                            <span
                              className='cart-ctxt'
                              style={{
                                color: 'rgb(18, 141, 226)',
                                fontSize: '16px'
                              }}
                            >
                              {formatMoney(
                                product?.donGiaSauKhuyenMai === 0
                                  ? product?.donGia
                                  : product?.donGiaSauKhuyenMai
                              )}
                            </span>
                            <br />
                            <del style={{ color: '#999', fontSize: '16px' }}>
                              {product?.donGiaSauKhuyenMai === 0
                                ? ''
                                : formatMoney(product?.donGia)}
                            </del>
                          </div>
                        </div>
                      </div>
                      <div className='cart-ctd'></div>
                      <div className='cart-ctd'>
                        <div
                          className='qty-change flex align-center'
                          style={{
                            position: `relative`,
                            top: `39px`,
                            right: `171px`
                          }}
                        >
                          <button
                            type='button'
                            className='qty-decrease flex align-center justify-center'
                            onClick={() => handleMinusCart(product)}
                          >
                            <i className='fas fa-minus'></i>
                          </button>

                          <div className='qty-value flex align-center justify-center'>
                            {changeCount.get(product.idSanPhamChiTiet)}
                          </div>

                          <button
                            type='button'
                            className='qty-increase flex align-center justify-center'
                            onClick={() => handlePlusCart(product)}
                          >
                            <i className='fas fa-plus'></i>
                          </button>
                        </div>
                      </div>

                      <div className='cart-ctd'></div>

                      <div className='cart-ctd'></div>
                    </div>
                  </>
                )
              })}

              {user.id === '' && productDetailsRedux.map(product => {
                 console.log("hihi")
                return (
                  <>
                    <div
                      className='cart-ctr'
                      key={product?.id}
                      style={{ marginTop: 10 }}
                    >
                      <div className='cart-ctd'>
                        <img
                          style={{ width: 112, height: 115 }}
                          src={product?.data.urlImage}
                        />

                        <button
                          type='button'
                          className='delete-btn text-dark'
                          onClick={() => deleteCartDetail(product.data)}
                          style={{
                            color: '#999',
                            position: 'relative',
                            right: '-42px',
                            marginTop: '7px'
                          }}
                        >
                          <i class='fa-regular fa-circle-xmark'></i> Xóa
                        </button>
                      </div>
                      <div
                        className='cart-ctd'
                        style={{ position: 'relative', top: '0px' }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            width: 550,
                            height: 140,
                            marginLeft: 10
                          }}
                        >
                          <div style={{ width: '127%' }}>
                            <span className='cart-ctxtf fw-7'>
                              {product?.data.nameProduct +
                                ' ' +
                                product?.data.ram +
                                'GB ' +
                                product?.data.rom +
                                'GB'}
                            </span>
                            <br />
                            <span>Màu : {product.data.color}</span>
                          </div>
                          <div style={{ width: '58%' }}>
                            <span
                              className='cart-ctxt'
                              style={{
                                color: 'rgb(18, 141, 226)',
                                fontSize: '16px'
                              }}
                            >
                              {formatMoney(
                                product?.data.priceDiscount === 0
                                  ? product?.data.price
                                  : product?.data.priceDiscount
                              )}
                            </span>
                            <br />
                            <del style={{ color: '#999', fontSize: '16px' }}>
                              {product?.data.priceDiscount === 0
                                ? ''
                                : formatMoney(product?.data.price)}
                            </del>
                          </div>
                        </div>
                      </div>
                      <div className='cart-ctd'></div>
                      <div className='cart-ctd'>
                        <div
                          className='qty-change flex align-center'
                          style={{
                            position: `relative`,
                            top: `39px`,
                            right: `171px`
                          }}
                        >
                          <button
                            type='button'
                            className='qty-decrease flex align-center justify-center'
                            onClick={() => handleMinusCart(product)}
                          >
                            <i className='fas fa-minus'></i>
                          </button>

                          <div className='qty-value flex align-center justify-center'>
                            {product.quantity}
                          </div>

                          <button
                            type='button'
                            className='qty-increase flex align-center justify-center'
                            onClick={() => handlePlusCart(product)}
                          >
                            <i className='fas fa-plus'></i>
                          </button>
                        </div>
                      </div>

                      <div className='cart-ctd'></div>

                      <div className='cart-ctd'></div>
                    </div>
                  </>
                )
              })}
            </div>

            <div className='countProductTemp'>
              <div>
                Tạm tính :
                <br />
                <span style={{ fontWeight: 'bold', color: '#128DE2' }}>
                  {user.id === '' ? formatMoney(totalAmountRedux) : formatMoney(totalAmount)}
                </span>
              </div>
              <div>
                <Link to='/check-out'>
                  <Button
                    variant='contained'
                    style={{
                      width: '100%',
                      marginTop: 5,
                      fontSize: 16
                    }}
                  >
                    Mua ngay({user.id === '' ? quantityRedux : productDetails.length})
                  </Button>
                </Link>
              </div>
            </div>

            <br />
          </div>
        </div>
      </div>
      <br/>
      <br/>
      <br/>


      <Toaster
          style={{ zIndex: -1, overflow: 'hidden', opacity: 0 }}
          position='top-center'
          reverseOrder={false}
          gutter={8}
          containerClassName='hhe'
          toastOptions={{
            // Define default options
            // className: '',
            // duration: 5000,
            // style: {
            //   background: '#4caf50',
            //   color: 'white'
            // },

            // Default options for specific types
            success: {
              duration: 1500,
              theme: {
                primary: 'green',
                secondary: 'white'
              },
              iconTheme: {
                primary: 'white',
                secondary: '#4caf50'
              },
              style: {
                background: '#4caf50',
                color: 'white'
              }
            },

            error: {
              duration: 1500,
              theme: {
                primary: '#f44336',
                secondary: 'white'
              },
              iconTheme: {
                primary: 'white',
                secondary: '#f44336'
              },
              style: {
                background: '#f44336',
                color: 'white'
              }
            }
          }}
        />
    </>
  )
}

export default CartPage
